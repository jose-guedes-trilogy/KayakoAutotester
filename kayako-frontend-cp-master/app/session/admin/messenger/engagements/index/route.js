import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  store: service(),

  model() {
    return this.get('store').query('engagement', { limit: 10000 });
  },

  // Actions
  actions: {
    edit(engagementId) {
      return this.transitionTo('session.admin.messenger.engagements.edit', engagementId);
    }
  }
});
