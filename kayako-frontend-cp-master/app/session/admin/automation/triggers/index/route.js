import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  store: service(),

  model() {
    return this.get('store').query('trigger', { limit: 10000 });
  },

  // Actions
  actions: {
    edit(triggerId) {
      return this.transitionTo('session.admin.automation.triggers.edit', triggerId);
    }
  }
});
