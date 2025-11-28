import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('team'), {
  model() {
    return this.store.findAll('business-hour', { reload: true })
      .then(businessHours => {
        let businesshour = businessHours.findBy('isDefault', true);
        let team = this.store.createRecord('team', { businesshour });

        return { team, businessHours };
      });
  },

  setupController(controller, model) {
    controller.setProperties(model);
    controller.initEdits();
  }
});
