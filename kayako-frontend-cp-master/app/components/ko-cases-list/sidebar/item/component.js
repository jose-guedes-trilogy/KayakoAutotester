import Component from '@ember/component';
import { task } from 'ember-concurrency';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import $ from 'jquery';
import { dasherize } from '@ember/string';

import { variation } from 'ember-launch-darkly';

export default Component.extend({
  tagName: '',

  metrics: service(),
  caseListTab: service(),
  store: service(),

  // Attributes
  casesView: null,
  viewHasCount: true,

  // CPs
  disabled: computed('casesView.viewCount.count', 'viewHasCount', function() {
    return !this.get('casesView.viewCount.count') && this.get('viewHasCount');
  }),

  isRefreshingCases: computed.readOnly('caseListTab.isRefreshingCases'),
  currentCachedView: computed.readOnly('caseListTab.currentCachedView'),

  // Methods
  handleCountChange(data) {
    this.get('store').push({
      data: {
        id: data.resource_id,
        type: dasherize(data.resource_type),
        attributes: data.changed_properties
      }
    });
  },

  // Actions
  actions: {
    refresh(e) {
      const a = $(e.target).closest('a');
      if (!a.hasClass('active') || a.hasClass('ember-transitioning-out') || a.hasClass('ember-transitioning-in')) {
        return;
      }

      if (variation('ops-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'Views - Refresh',
          category: 'Agent'
        });
      }

      this.get('refresh').perform();
    }
  },

  // Tasks
  refresh: task(function * () {
    yield this.get('caseListTab').get('fetchCases').perform();
  }).drop()
});
