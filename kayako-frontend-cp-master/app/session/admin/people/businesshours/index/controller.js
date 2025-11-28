import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  store: service(),
  i18n: service(),
  plan: service(),
  confirmation: service(),

  // CPs
  reachedLimit: computed('model', function () {
    return this.get('plan').limitFor('business_hours') <= this.get('model.meta.total');
  }),

  // Actions
  actions: {
    transitionToAddNewBusinessHour() {
      this.transitionToRoute('session.admin.people.businesshours.new');
    },
    editBusinessHour(businessHour) {
      this.transitionToRoute('session.admin.people.businesshours.edit', businessHour);
    },
    makeDefault(businessHour, event) {
      event.stopPropagation();
      const prevDefault = this.get('store').peekAll('business-hour').findBy('isDefault', true);
      prevDefault.set('isDefault', false);

      businessHour.set('isDefault', true);
      businessHour.save().then(
        () => prevDefault.reload(),
        () => businessHour.rollbackAttributes()
      );
    },

    deleteBusinessHour(businessHour, e) {
      e.preventDefault();
      e.stopPropagation();
      return this.get('confirmation').confirm({ intlConfirmationBody: 'generic.confirm.delete' })
        .then(() => businessHour.destroyRecord());
    }
  }
});
