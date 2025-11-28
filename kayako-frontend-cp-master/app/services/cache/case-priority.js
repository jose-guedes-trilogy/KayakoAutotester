import Service from '@ember/service';
import { inject as service } from '@ember/service';

export default Service.extend({
  storeCache: service(),

  getAll() {
    const storeCache = this.get('storeCache');
    return storeCache.query('case-priority', {}, { ttl: 60000 }); // 1 minute
  },

  invalidateCache() {
    this.get('storeCache').invalidateCache('case-priority', {});
  }
});
