import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('businessHour'), {
  model() {
    return this.get('store').createRecord('business-hour', {
      zones: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      }
    });
  },

  setupController(controller, businessHour) {
    controller.setProperties({ businessHour });
    controller.initEdits();
  }
});
