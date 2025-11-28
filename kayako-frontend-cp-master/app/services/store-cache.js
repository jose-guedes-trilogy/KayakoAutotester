import { Promise as EmberPromise } from 'rsvp';
import { on } from '@ember/object/evented';
import Service, { inject as service } from '@ember/service';
import _ from 'npm:lodash';
import moment from 'moment';

export default Service.extend({
  store: service(),
  date: service(),

  _storeCache: null,

  initCache: on('init', function () {
    this._storeCache = {};
  }),

  query(type, query, {
    reload = false,
    ttl = 0
  } = {}) {
    const serializedQuery = type + ':' + _.map(query, (value, key) => `${key}:${value}`).sort().join(':');

    if (!this._requiresCacheUpdate(serializedQuery, reload, ttl)) {
      return new EmberPromise((resolve) => {
        resolve(this._storeCache[serializedQuery].result);
      });
    } else {
      return this.get('store').query(type, query)
      .then((data) => {
        this._storeCache[serializedQuery] = {
          cachedAt: moment(this.get('date').getCurrentDate()),
          result: data
        };
        return data;
      });
    }
  },

  invalidateCache(type, query) {
    const serializedQuery = type + ':' + _.map(query, (value, key) => `${key}:${value}`).sort().join(':');
    Reflect.deleteProperty(this._storeCache, serializedQuery);
  },

  _requiresCacheUpdate(query, shouldReload, ttl) {
    if (shouldReload || !this._storeCache[query]) {
      return true;
    }

    const earliestLegalCachedAt = ttl ? moment().subtract(ttl, 'ms') : null;
    const cachedAt = this._storeCache[query].cachedAt;

    return earliestLegalCachedAt && earliestLegalCachedAt.isAfter(cachedAt);
  }
});
