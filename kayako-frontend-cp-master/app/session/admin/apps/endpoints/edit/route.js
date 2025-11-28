import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  model(params) {
    return this.store.findRecord('endpoint', params.endpoint_id);
  },

  setupController(controller, endpoint) {
    controller.setProperties({ endpoint });
    controller.initEdits();
  }
});
