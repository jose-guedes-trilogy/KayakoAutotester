import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',
  socket: service(),

  name: null,
  params: {},
  events: null,

  'on-join': () => {},
  'on-presence-change': () => {},

  init() {
    if (!this.get('events')) {
      this.set('events', {});
    }

    this._super(...arguments);
  },

  didReceiveAttrs() {
    this._super(...arguments);

    const name = this.get('name');

    if (!name) {
      this._leave();
      return;
    }

    if (this._channel && this._channel.get('name') === name) {
      return;
    }

    this._leave();
    this._join();
  },

  willDestroyElement() {
    this._super(...arguments);
    this._leave();
  },

  _join() {
    this._channel = this.get('socket').channel(this.get('name'), this.get('params')).lock();
    const events = this.get('events');

    Object.keys(events).forEach(k => {
      this._channel.on(k, events[k]);
    });

    this._channel.on('presence-change', this, '_onPresenceChanged');

    this._channel.join().then(() => {
      if (this.get('isDestroying') || this.get('isDestroyed')) {
        return;
      }

      this.get('on-join')();
      this.get('on-presence-change')(this._channel.get('presence'));
    });
  },

  _leave() {
    if (!this._channel) {
      return;
    }

    const events = this.get('events');

    Object.keys(events).forEach(k => {
      this._channel.off(k, events[k]);
    });

    this._channel.off('presence-change', this, '_onPresenceChanged');

    this._channel.unlock();
    this._channel = null;
  },

  _onPresenceChanged(presence) {
    this.get('on-presence-change')(presence);
  }

});
