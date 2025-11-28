import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('mailbox'), {
  model(params) {
    return RSVP.hash({
      mailbox: this.store.createRecord('mailbox'),
      brands: this.store.findAll('brand')
    });
  },

  setupController(controller, model) {
    model.mailbox.set('brand', model.brands.findBy('isDefault', true));
    controller.setProperties(model);
    controller.initEdits();
  }
});
