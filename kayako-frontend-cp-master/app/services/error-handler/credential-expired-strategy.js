import Service, { inject as service } from '@ember/service';

export default Service.extend({
  notification: service('notification'),
  i18n: service(),

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
        title: this.get('i18n').t('generic.user_credential_expired'),
        autodismiss: true,
        dismissable: true
      });

      this.records = [];
    }

    return recordsCount;
  }
});
