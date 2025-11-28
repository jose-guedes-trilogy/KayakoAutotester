import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Component.extend({

  // Services
  store: service(),
  i18n: service(),
  notification: service(),

  // CPs
  sortedEngagements: computed('engagements.@each.executionOrder', function() {
    return this.get('engagements').sortBy('executionOrder');
  }),

  // Tasks
  reorderEngagements: task(function * (newOrder) {
    let data = { engagement_ids: newOrder.mapBy('id') };
    newOrder.forEach((engagement, index) => engagement.set('executionOrder', index));
    try {
      let response = yield this.get('store').adapterFor('engagement').reorderEngagements(data);
      this.get('store').pushPayload('engagement', response);
    } catch (error) {
      this.get('notification').error(this.get('i18n').t('admin.engagements.notifications.error.reorder'));
    }
  }),

  // Actions
  actions: {
    stop(event) {
      event.stopPropagation();
    }
  }
});
