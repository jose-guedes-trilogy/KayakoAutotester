import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  notification: null,
  close: () => {},

  user: computed.reads('notification.activity.actorUser'),
  subject: computed('notification.activity.object.title', function() {
    let title = this.get('notification.activity.object.title') || '';

    if (title.length > 50) {
      return `${title.slice(0, 50)}...`;
    }

    return title;
  })
});
