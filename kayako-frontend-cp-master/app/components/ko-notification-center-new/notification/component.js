import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  notification: null,
  routing: service('-routing'),
  isRead: computed.equal('notification.readState', 'READ'),
  isBreach: computed.equal('notification.activity.verb', 'BREACH'),
  avatarUrl: computed.readOnly('notification.activity.actor.image'),
  url: computed('notification', function () {
    let objectUrl = this.get('notification.activity.object.url') || '';
    let notificationId = this.get('notification.id');

    objectUrl = objectUrl.replace(/case/g, 'conversation');

    return `${objectUrl}?notificationId=${notificationId}`;
  }),

  actions: {
    closeDropdown() {
      this.get('close')();
    }
  }
});
