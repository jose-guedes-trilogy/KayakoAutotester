import Service from '@ember/service';
import config from 'frontend-cp/config/environment';

export default Service.extend({
  prefix: config.localStore.prefix,

  local: window.localStorage,
  session: window.sessionStorage,

  _store(persist) {
    return persist ? this.get('local') : this.get('session');
  },

  /**
   * Setup namespace for service usage
   *
   * @param {String} namespace Namespace
   * @param {String} key Key to concatenate with namespace
   * @returns {string}
   */
  _getKeyWithNamespace(namespace, key) {
    return [this.get('prefix'), namespace, key].join(':');
  },

  /**
   * Retrieve an item from the store by key
   *
   * Items are stored as JSON strings
   *
   * @param  {string} namespace - Namespace in local storage
   * @param  {string} key - Key to retrieve
   * @param {Boolean} options.persist Use local storage instead of session storage
   * @return {*} Stored object
   */
  getItem(namespace, key, { persist = false } = {}) {
    key = this._getKeyWithNamespace(namespace, key);

    let item = this._store(persist).getItem(key);

    // Note: stringified undefined will return 'undefined'
    if (item !== null && item !== 'undefined') {
      return JSON.parse(item);
    } else {
      return null;
    }
  },

  /**
   * Place item in the store as a JSON string.
   *
   * Note: only plain objects can be stored.
   *
   * @param {string}  namespace [description]
   * @param {string}  key       [description]
   * @param {mixed}  item      [description]
   * @param {Boolean} options.persist Use local storage instead of session storage
   */
  setItem(namespace, key, item, { persist = false } = {}) {
    key = this._getKeyWithNamespace(namespace, key);

    // using typeof for strict undefined check
    if (typeof item !== 'undefined') {
      this._store(persist).setItem(key, JSON.stringify(item));
    }
  },

  /**
   * Remove item from the store.
   *
   * @param {string}  namespace [description]
   * @param {[type]}  key       key of item to be removed
   * @param {Boolean} options.persist Use local storage instead of session storage
   */
  removeItem(namespace, key, { persist = false } = {}) {
    key = this._getKeyWithNamespace(namespace, key);

    this._store(persist).removeItem(key);
  },

  /**
   * Clear local and session storage by namespace
   *
   * @param {String} namespace Namespace to clear
   */
  clearAllByNamespace(namespace) {
    const nsRegexp = new RegExp(`^${this.get('prefix')}:${namespace}:`, 'i');
    this._clearStorageByRegex(this.get('local'), nsRegexp);

    // Note, ignores the prefix for the session because...
    const appRegexp = new RegExp(`^${this.get('prefix')}:`, 'i');
    this._clearStorageByRegex(this.get('session'), appRegexp);
  },

  _clearStorageByRegex(store, regex) {
    if (typeof store !== 'undefined') {
      let keys = [];
      for (let i = 0; i < store.length; i++) {
        keys.push(store.key(i));
      }

      keys.forEach(key => {
        if (regex.test(key)) {
          store.removeItem(key);
        }
      });
    }
  },

  /**
   * Clear everything in the store for the app's prefix
   */
  clearAll() {
    const appRegexp = new RegExp(`^${this.get('prefix')}:`, 'i');

    this._clearStorageByRegex(this.get('local'), appRegexp);
    this._clearStorageByRegex(this.get('session'), appRegexp);
  }
});
