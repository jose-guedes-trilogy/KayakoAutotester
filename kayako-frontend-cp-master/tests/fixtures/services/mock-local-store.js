import Service from '@ember/service';

export default Service.extend({
  _localStore: null,
  _sessionStore: null,

  init: function() {
    this._super();
    this.set('_localStore', {});
    this.set('_sessionStore', {});
  },

  getItem: function(key, {
    persist = false
  } = {}) {
    let store = this.get(persist ? '_localStore' : '_sessionStore');
    return store[key];
  },

  setItem: function(key, value, {
    persist = false
  } = {}) {
    let store = this.get(persist ? '_localStore' : '_sessionStore');
    store[key] = value;
  },

  removeItem: function(key, {
    persist = false
  } = {}) {
    let store = this.get(persist ? '_localStore' : '_sessionStore');
    Reflect.deleteProperty(store, key);
  },

  clearAll: function() {
    this.set('_localStore', {});
    this.set('_sessionStore', {});
  }
});
