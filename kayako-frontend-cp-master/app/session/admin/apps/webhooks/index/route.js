import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  store: service(),

  model() {
    return this.get('store').findAll('token', {reload: true});
  },

  // Actions
  actions: {
    edit(webhookId) {
      return this.transitionTo('session.admin.apps.webhooks.edit', webhookId);
    }
  }
});
