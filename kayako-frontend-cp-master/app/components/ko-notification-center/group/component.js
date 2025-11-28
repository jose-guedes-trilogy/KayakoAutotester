import _ from 'npm:lodash';
import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  notificationsList: [],
  groupedNotifications: computed('notificationsList.[]', function () {
    return _(this.get('notificationsList'))
    .groupBy((notification) => notification.get('notificationDay'))
    .value();
  })
});
