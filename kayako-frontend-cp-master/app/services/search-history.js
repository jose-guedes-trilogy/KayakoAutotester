import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

const SEARCH_NAMESPACE = 'search';
const RECENT_SEARCH_KEY = 'recent_searches';

export default Service.extend({
  _recentSearches: null,

  localStore: service(),

  init() {
    const oldSessionSearches = this.get('localStore').getItem(SEARCH_NAMESPACE, RECENT_SEARCH_KEY);
    this.set('_recentSearches', oldSessionSearches || []);
  },

  logSearch(searchTerm) {
    const recentSearches = this.get('_recentSearches');

    recentSearches.removeObject(searchTerm);
    recentSearches.pushObject(searchTerm);

    if (recentSearches.get('length') > 5) {
      recentSearches.removeAt(0);
    }

    this.get('localStore').setItem(SEARCH_NAMESPACE, RECENT_SEARCH_KEY, recentSearches);
  },

  recentSearches: computed('_recentSearches.[]', function() {
    return this.get('_recentSearches').slice(0).reverse();
  })
});
