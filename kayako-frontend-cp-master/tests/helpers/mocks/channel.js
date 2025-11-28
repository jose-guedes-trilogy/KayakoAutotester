import { next } from '@ember/runloop';

export default class MockChannel {
  constructor(name, params) {
    this.name = name;
    this.params = params;
    this._receivers = {};
    this._callbacks = {};
  }

  join() {
    next(() => this.emit('ok', {}));
    return this;
  }

  leave() {
    next(() => this.emit('ok', {}));
    return this;
  }

  push() {
    next(() => this.emit('ok', {}));
    return this;
  }

  receive(event, callback) {
    this._receivers[event] = this._receivers[event] || [];
    this._receivers[event].push(callback);
    return this;
  }

  on(event, callback) {
    this._callbacks[event] = this._callbacks[event] || [];
    this._callbacks[event].push(callback);
  }

  off(event) {
    this._callbacks[event] = [];
  }

  onError(callback) {
    this.on('error', callback);
  }

  onClose(callback) {
    this.on('close', callback);
  }

  trigger(event, ...args) {
    let callbacks = this._callbacks[event];

    if (!callbacks) { return; }

    callbacks.forEach(callback => callback(...args));
  }

  emit(event, ...args) {
    let receivers = this._receivers[event];

    if (!receivers) { return; }

    receivers.forEach(receiver => receiver(...args));
  }
}
