import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('endpoint'), {
  model(params) {
    return this.store.createRecord('endpoint', { fieldType: params.type });
  },

  setupController(controller, endpoint) {
    controller.setProperties({ endpoint });
    controller.initEdits();
  }
});
