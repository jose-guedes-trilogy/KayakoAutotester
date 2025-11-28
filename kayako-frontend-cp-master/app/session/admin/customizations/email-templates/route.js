import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('brands'), {
  model() {
    return this.store.findAll('brand').then(brands => {
      let brand = brands.findBy('isDefault', true);

      return RSVP.hash({
        brands: brands,
        emailCaseNotification: this.store.queryRecord('template', { brand, name: 'cases_email_notification' }),
        emailNotification: this.store.queryRecord('template', { brand, name: 'base_email_notification' }),
        emailSatisfaction: this.store.queryRecord('template', { brand, name: 'cases_email_satisfaction' })
      });
    });
  },

  setupController(controller, model) {
    controller.set('brands', model.brands.filterBy('isEnabled', true).sortBy('name'));
    controller.set('emailCaseNotification', model.emailCaseNotification);
    controller.set('emailNotification', model.emailNotification);
    controller.set('emailSatisfaction', model.emailSatisfaction);
    controller.initEdits();
  }
});
