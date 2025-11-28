import MockChannel from './channel';
import { next } from '@ember/runloop';

export default class MockSocket {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this._channels = {};
    this._callbacks = {
      open: [],
      error: [],
      close: []
    };
  }

  isConnected() {
  }

  onOpen(callback) {
    this._callbacks.open.push(callback);
  }

  onError(callback) {
    this._callbacks.error.push(callback);
  }

  onClose(callback) {
    this._callbacks.close.push(callback);
  }

  connect() {
    next(() => this.trigger('open'));
  }

  disconnect() {
  }

  channel(name/*, params*/) {
    if (!this._channels[name]) {
      this._channels[name] = new MockChannel();
    }
    return this._channels[name];
  }

  trigger(event, ...args) {
    let callbacks = this._callbacks[event];

    if (!callbacks) {
      throw new Error(`Unrecognised event "${event}"`);
    }

    callbacks.forEach(callback => callback(...args));
  }
}
