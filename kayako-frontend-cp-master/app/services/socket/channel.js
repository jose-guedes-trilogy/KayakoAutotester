import RSVP from 'rsvp';
import EmberObject from '@ember/object';
import { join } from '@ember/runloop';
import Evented from '@ember/object/evented';
import Ember from 'ember';
import { Presence } from 'phoenix';
import { assert } from '@ember/debug';

const Logger = Ember.Logger;
const performance = window.performance || Date;

export default EmberObject.extend(Evented, {
  _socket: null,
  _locks: 0,

  params: null,
  name: null,
  presence: null,
  state: 'closed',

  init() {
    this._super(...arguments);
    this._queue = [];
    this.set('presence', {});
  },

  lock() {
    this.incrementProperty('_locks');
    return this;
  },

  unlock() {
    assert(`Channel is not locked (${this.get('name')})`, this.get('_locks') !== 0);

    const newValue = this.decrementProperty('_locks');
    if (newValue === 0) {
      this.leave();
    }
    return this;
  },

  join() {
    if (this._joinPromise) {
      return this._joinPromise;
    }

    const { name, params } = this.getProperties('name', 'params');
    this._channel = this.get('_socket').channel(name, params);
    this.set('state', 'joining');

    const joinCB = this.onMemberJoined.bind(this);
    const leaveCB = this.onMemberLeft.bind(this);

    this._channel.on('presence_state', state => {
      const presence = Presence.syncState(this.get('presence'), state, joinCB, leaveCB);
      this.set('presence', presence);
      this.trigger('presence-change', presence);
    });

    this._channel.on('presence_diff', diff => {
      const presence = Presence.syncDiff(this.get('presence'), diff, joinCB, leaveCB);
      this.set('presence', presence);
      this.trigger('presence-change', presence);
    });

    this._channel.onClose(() => {
      if (!this.get('isDestroying') && !this.get('isDestroyed')) {
        this.set('state', 'closed');
      }
    });

    this._queue.forEach(name => this._addEventHandler(name));
    this._queue = [];

    // const start = performance.now();
    // Logger.debug('--> [JOIN]', name, deepClone(params));

    this._joinPromise = new RSVP.Promise((resolve, reject) => {
      this._channel.join()
        .receive('ok', r => join(null, resolve, r))
        .receive('error', e => join(null, reject, e))
        .receive('timeout', () => join(null, reject, false));
    })
    .catch(e => {
      // const end = performance.now();
      // const ms = Math.ceil(end - start);
      // Logger.debug('!-- [JOIN]', name, `(${ms}ms)`, e);
      this._joinPromise = null;
      throw e;
    })
    .then(response => {
      this.set('state', 'joined');
      this.set('data', response);

      // const end = performance.now();
      // const ms = Math.ceil(end - start);
      // Logger.debug('<-- [JOIN]', name, `(${ms}ms)`, deepClone(response));

      return this;
    });

    return this._joinPromise;
  },

  leave() {
    assert(`Cannot leave, channel has not been joined (${this.get('name')})`, this._channel);

    const channel = this._channel;
    this._channel = null;
    this._joinPromise = null;
    this.set('state', 'closing');

    Logger.debug('--x [LEAVE]', this.get('name'));
    return new RSVP.Promise((resolve, reject) => {
      channel.leave()
        .receive('ok', r => join(null, resolve, r))
        .receive('error', e => join(null, reject, e))
        .receive('timeout', () => join(null, reject, false));
    });
  },

  onMemberJoined(id/*, prev, metas*/) {
    this.trigger('presence-joined', id, this);
  },

  onMemberLeft(id) {
    this.trigger('presence-left', id, this);
  },

  request(message, data) {
    assert(`Cannot request, channel has not been joined (${this.get('name')})`, this._channel);

    const start = performance.now();
    Logger.debug('--> [REQUEST]', message, deepClone(data));

    const p = new RSVP.Promise((resolve, reject) => {
      this._channel.push(message, data)
        .receive('ok', r => join(null, resolve, r))
        .receive('error', e => join(null, reject, e))
        .receive('timeout', () => join(null, reject, false));
    });

    return p.then(response => {
      const end = performance.now();
      const ms = Math.ceil(end - start);
      Logger.debug('<-- [REQUEST]', message, `(${ms}ms)`, deepClone(response));
      return response;
    }).catch(e => {
      const end = performance.now();
      const ms = Math.ceil(end - start);
      Logger.error('!-- [REQUEST]', message, `(${ms}ms)`, e);
      throw e;
    });
  },

  push(message, data) {
    assert(`Cannot push, channel has not been joined (${this.get('name')})`, this._channel);

    Logger.debug('--> [TRIGGER]', message, deepClone(data));
    this._channel.push(message, data)
      .receive('error', e => {
        Logger.error('!-- [TRIGGER]', message, e);
        throw e;
      });
  },

  on(name) {
    if (!this.has(name) && !name.match(/^presence-/)) {
      if (this._channel) {
        this._addEventHandler(name);
      } else {
        this._queue.push(name);
      }
    }

    // _super has to be after, otherwise `has` is always false
    this._super(...arguments);
    return this;
  },

  off(name) {
    this._super(...arguments);

    if (!this._channel) {
      return this;
    }

    if (!this.has(name) && !name.match(/^presence-/)) {
      this._channel.off(name);
    }

    return this;
  },

  _addEventHandler(name) {
    this._channel.on(name, data => this.trigger(name, data, this));
  }

});

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
