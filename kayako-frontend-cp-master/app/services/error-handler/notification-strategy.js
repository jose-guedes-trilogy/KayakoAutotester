import Service, { inject as service } from '@ember/service';

export default Service.extend({
  notification: service('notification'),

  init() {
    this._super(...arguments);
    this.records = [];
  },

  processAll(records) {
    this.records = records || [];
    this.process();
  },

  accept(record) {
    this.records.push(record);
  },

  process() {
    const recordsCount = this.records.length;

    if (recordsCount) {
      this.records.forEach(notification => {
        let title = notification.message || '';

        title = title.replace(/\\n/g, '\n');

        this.get('notification').add({
          type: notification.type.toLowerCase(),
          title,
          href: notification.related_href,
          hrefText: notification.related_label,
          autodismiss: !notification.sticky,
          dismissable: true
        });
      });

      this.records = [];
    }

    return recordsCount;
  }
});
