import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  model(params) {
    return this.store.createRecord('oauth-client', {
      scopes: []
    });
  },

  setupController(controller, model) {
    controller.setProperties({ model });
    controller.initEdits();
  }
});
