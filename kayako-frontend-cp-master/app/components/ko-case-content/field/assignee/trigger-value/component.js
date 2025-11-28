import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',
  hideYouLabel: false,

  session: service(),

  isMe: computed('session.user.id', 'agent.id', function () {
    return this.get('session.user.id') === this.get('agent.id');
  }),
});
