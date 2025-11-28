import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  notification: null,
  close: () => {},

  sla: computed.reads('notification.activity.actor.title'),
  subject: computed('notification.activity.case.title', function() {
    let title = this.get('notification.activity.object.title');

    if (title.length > 50) {
      return `${title.slice(0, 50)}...`;
    }

    return title;
  })
});
