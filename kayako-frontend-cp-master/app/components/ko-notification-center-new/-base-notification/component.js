import Component from '@ember/component';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',
  notificationCenter: service(),

  notification: null,
  close: () => {},

  isRead: computed.equal('notification.readState', 'READ'),
  url: computed('notification', function () {
    let objectUrl = this.get('notification.activity.object.url') || '';
    let notificationId = this.get('notification.id');

    objectUrl = objectUrl.replace(/case/g, 'conversation');

    return `${objectUrl}?notificationId=${notificationId}`;
  }),

  markAsRead: task(function * () {
    const notificationId = this.get('notification.id');
    return yield this.get('notificationCenter').markAsRead(notificationId);
  }).drop(),

  actions: {
    markAsRead(event) {
      event.preventDefault();
      event.stopPropagation();
      this.get('markAsRead').perform();
    }
  }
});
