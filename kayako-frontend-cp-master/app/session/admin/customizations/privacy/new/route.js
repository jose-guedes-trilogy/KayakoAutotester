import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('privacy'), {
  model(params) {
    return this.store.createRecord('privacy-policy', { fieldType: params.type });
  },

  setupController(controller, privacy) {
    controller.setProperties({ privacy });
    controller.initEdits();
  }
});
