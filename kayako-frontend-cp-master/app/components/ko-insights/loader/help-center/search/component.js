import ObjectProxy from '@ember/object/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';

export default Component.extend({
  tagName: '',
  insights: service(),
  store: service(),

  metricsQueryParams: null,

  failedSearches: null,
  popularSearches: null,

  request: computed('metricsQueryParams', function() {
    const insights = this.get('insights');
    const endpoint = insights.searchEndpoint();
    const adapter = getOwner(this).lookup('adapter:application');

    return ObjectProxy.extend(PromiseProxyMixin).create({
      promise: adapter.ajax(endpoint, 'GET', this.get('metricsQueryParams')).then(payload => {
        if (this.isDestroying || this.isDestroyed) {
          return null;
        }

        this.setProperties({
          failedSearches: payload.data.failed_searches ? payload.data.failed_searches.sortBy('attempt_count').reverseObjects() : null,
          popularSearches: payload.data.popular_searches ? payload.data.popular_searches.sortBy('attempt_count').reverseObjects() : null
        });

        return payload;
      })
    });
  })
});
