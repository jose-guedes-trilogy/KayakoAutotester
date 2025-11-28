import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  model(params) {
    return RSVP.hash({
      brand: this.modelFor('session.admin.customizations.brands.edit'),
      locales: this.store.findAll('locale')
    });
  },

  setupController(controller, model) {
    controller.setProperties(model);
    controller.initEdits();
  }
});
