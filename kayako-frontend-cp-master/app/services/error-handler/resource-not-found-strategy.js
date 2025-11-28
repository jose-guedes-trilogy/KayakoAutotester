import Service, { inject as service } from '@ember/service';
import { getBasePath } from 'frontend-cp/utils/base-path';

export default Service.extend({
  notification: service(),
  i18n: service(),
  router: service(),

  init() {
    this._super(...arguments);
    this.records = [];
  },

  accept(record) {
    this.records.push(record);
  },

  transitionTo(path) {
    this.get('router').transitionTo(path);
  },

  process() {
    const recordsCount = this.records.length;

    if (recordsCount) {
      this.get('notification').add({
        type: 'error',
        title: this.get('i18n').t('generic.resource_not_found'),
        autodismiss: true,
        dismissable: true
      });
      let path = getBasePath();
      let pathname = location.pathname;
      if (pathname !== path) {
        this.transitionTo(path);
      }

      this.records = [];
    }

    return recordsCount;
  }
});
