import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  model(params) {
    return RSVP.hash({
      brands: this.store.findAll('brand'),
      page: this.store.findRecord('facebook-page', params.page_id)
    });
  },

  setupController(controller, model) {
    controller.setProperties(model);
    controller.initEdits();
  }
});
