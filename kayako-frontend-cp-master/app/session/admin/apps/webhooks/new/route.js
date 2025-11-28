import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('model'), {
  model() {
    return this.get('store').createRecord('token', {
      isEnabled: true
    });
  },

  // Actions
  actions: {
    didSave() {
      this.transitionTo('session.admin.apps.webhooks.edit', this.get('controller').get('model'));
    },

    cancel(webhook) {
      this.transitionTo('session.admin.apps.webhooks');
    }
  }
});
