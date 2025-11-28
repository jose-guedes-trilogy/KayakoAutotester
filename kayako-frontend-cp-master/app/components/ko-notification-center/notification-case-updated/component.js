import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  notification: null,
  close:() => {},

  isBreach: computed.equal('notification.activity.verb', 'BREACH'),
  avatarUrl: computed.readOnly('notification.activity.actor.image'),
  summary: computed.reads('notification.activity.summary')
});
