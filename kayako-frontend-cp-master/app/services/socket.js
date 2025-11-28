import { getOwner } from '@ember/application';
import RSVP from 'rsvp';
import config from 'frontend-cp/config/environment';
import Service from '@ember/service';
import Evented from '@ember/object/evented';
import Channel from './socket/channel';
import Ember from 'ember';

const {
  Logger
} = Ember;

export const STATE_CLOSED = 'closed';
export const STATE_CONNECTING = 'connecting';
export const STATE_OPEN = 'open';

export default Service.extend(Evented, {
  state: STATE_CLOSED,
  hasAttemptedConnection: false,
  hasConnectedOnce: false,

  init() {
    this._super(...arguments);
    this._channels = {};
  },

  connect(params = {}) {
    if (this._socket && this._socket.isConnected()) {
      return RSVP.resolve();
    }

    this._socket = this.createSocket({ params });

    return new RSVP.Promise((resolve, reject) => {
      this.set('hasAttemptedConnection', true);

      this._socket.onOpen(() => {
        this.set('hasConnectedOnce', true);
        this.set('state', STATE_OPEN);
        this.trigger('onOpen');
        resolve();
      });

      this._socket.onError(e => {
        this.set('state', STATE_CLOSED);
        this.trigger('onError');
        reject(e);
      });

      this._socket.onClose(() => {
        this.set('state', STATE_CLOSED);
        this.trigger('onClose');
      });

      this.set('state', STATE_CONNECTING);
      this._socket.connect();
    });
  },

  channel(name, params = {}) {
    if (!this._socket) {
      throw new Error(`Must connect before joining a channel (${name})`);
    }

    let channel = this._channels[name];
    if (!channel) {
      channel = this.createChannel({ _socket: this._socket, name, params });
      this._channels[name] = channel;
    }

    return channel;
  },

  hasJoinedChannel(name) {
    const channel = this._channels[name];
    return channel && channel.get('state') === 'joined';
  },

  push(name, message, data = {}) {
    const channel = this._channels[name];
    if (!channel) {
      throw new Error(`channel has not been joined (${name})`);
    }
    return channel.push(message, data);
  },

  request(name, message, data = {}) {
    const channel = this._channels[name];
    if (!channel) {
      return RSVP.reject(new Error(`channel has not been joined (${name})`));
    }
    return channel.request(message, data);
  },

  leaveChannel(name) {
    const channel = this._channels[name];
    if (!channel) {
      Logger.debug(`Warning: channel has not been joined (${name})`);
      return RSVP.resolve();
    }
    return channel.leave();
  },

  createSocket(options) {
    let url = config.kreSocket;
    const Socket = getOwner(this).lookup('constructor:socket');
    return new Socket(url, options);
  },

  createChannel(options) {
    return Channel.create(options);
  }
});
