import Service, { inject as service } from '@ember/service';

export default Service.extend({
  i18n: service(),
  notification: service(),

  init() {
    this._super(...arguments);
    this.records = [];
  },

  accept(record) {
    this.records.push(record);
  },

  process() {
    const recordsCount = this.records.length;

    if (recordsCount) {
      this.get('notification').add({
        type: 'error',
        title: this.get('i18n').t('generic.permissions_denied'),
        autodismiss: true,
        dismissable: true
      });

      this.records = [];
    }

    return recordsCount;
  }
});
