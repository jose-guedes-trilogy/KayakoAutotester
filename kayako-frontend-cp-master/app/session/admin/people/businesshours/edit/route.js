import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  model(params) {
    return this.get('store').findRecord('business-hour', params.businesshour_id);
  },

  setupController(controller, businessHour) {
    controller.setProperties({ businessHour });
    controller.initEdits();
  }
});
