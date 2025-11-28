import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';
import Route from '@ember/routing/route';

export default Route.extend(DirtyAwareRoute(), {
  model(params) {
    return this.store.findRecord('view', params.view_id);
  },

  setupController(controller, caseView) {
    controller.setProperties({ caseView });
    controller.initEdits();
  }
});
