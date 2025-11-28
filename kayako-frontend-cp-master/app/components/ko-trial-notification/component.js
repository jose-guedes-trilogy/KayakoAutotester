import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',
  plan: service(),
  routing: service('-routing'),

  actions: {
    upgrade (dropdown) {
      dropdown.actions.close();
      this.get('routing').transitionTo('session.admin.account.trial');
    }
  }
});
