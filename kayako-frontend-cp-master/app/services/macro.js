import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';

const OFFSET = 0;
const LIMIT = 250;

/*
 * Recursively request all macros via pagination
 *
 *  - Fetching 300+ macros is too much work for API
 *  - Querys are not cached via ember data
 *  - Loop through macros 20 at a time, and ensure that we only ever
 *    do this once when we hit the agent root
 */

export default Service.extend({
  store: service(),

  hasRequestedMacros: false,

  fetchMacros() {
    if (this.get('hasRequestedMacros')) {
      return;
    }
    this.set('hasRequestedMacros', true);

    this._fetchMacroRange(OFFSET, LIMIT);
  },

  trackUsage(id) {
    const adapter = getOwner(this).lookup('adapter:application');
    const url = `${adapter.namespace}/cases/macros/${id}/used`;
    return adapter.ajax(url, 'PUT');
  },

  _fetchMacroRange(offset, limit) {
    this.get('store').query('macro', {offset: offset, limit: limit, include: '', fields: 'title'}).then(newMacros => {
      let total = newMacros.meta.total;
      let currentMax = offset + limit;

      if (total && total > currentMax) {
        this._fetchMacroRange(currentMax, limit);
      }
    });
  }
});
