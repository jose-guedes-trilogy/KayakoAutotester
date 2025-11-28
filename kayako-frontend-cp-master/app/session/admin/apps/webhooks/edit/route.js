import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  model(params) {
    return this.store.findRecord('token', params.webhook_id);
  },

  setupController(controller) {
    this._super(...arguments);
    controller.setProperties(this.modelFor('session.admin.apps.webhooks'));
  },

  // Actions
  actions: {
    didSave() {
      this.transitionTo('session.admin.apps.webhooks');
    },

    cancel() {
      this.transitionTo('session.admin.apps.webhooks');
    }
  }
});
