import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  model(params) {
    return RSVP.hash({
      mailbox: this.store.findRecord('mailbox', params.mailbox_id),
      brands: this.store.findAll('brand')
    });
  },

  setupController(controller, model) {
    controller.setProperties(model);
    controller.initEdits();
  }
});
