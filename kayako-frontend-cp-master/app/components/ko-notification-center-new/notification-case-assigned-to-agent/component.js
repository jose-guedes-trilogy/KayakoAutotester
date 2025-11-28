import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  notification: null,
  close: () => {},

  user: computed.reads('notification.activity.objectActorUser')
});
