import Component from '@ember/component';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Component.extend({

  // Services
  store: service(),
  i18n: service(),
  notification: service(),
  engagement: null,
  tagName: '',

  // Tasks
  toggleStatus: task(function * () {
    const engagement = this.get('engagement');
    engagement.toggleProperty('isEnabled');
    const engagementId = get(engagement, 'id');
    const data = { 'is_enabled': get(engagement, 'isEnabled') };
    /**
     * CAUTION: Please don't change below logic to use ember-data's
     * save(). Current logic ensures that list reordering works the way
     * it works which is dependent on executionOrder of engagements
     * and is maintained on client.
     */
    try {
      yield this.get('store').adapterFor('engagement').updateStatus(engagementId, data);
      if (this.get('engagement.isEnabled')) {
        this.get('notification').success(this.get('i18n').t('admin.engagements.notifications.success.engagement_enabled'));
      } else {
        this.get('notification').success(this.get('i18n').t('admin.engagements.notifications.success.engagement_disabled'));
      }
    } catch (err) {
      engagement.toggleProperty('isEnabled');
      this.get('notification').success(this.get('i18n').t('admin.engagements.notifications.error.toggle_status'));
    }
  })
});
