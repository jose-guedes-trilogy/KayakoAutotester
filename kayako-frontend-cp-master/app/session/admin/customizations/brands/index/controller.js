import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  // Services
  i18n: service(),
  notification: service(),
  confirmation: service(),
  plan: service(),

  // CPs
  enabledBrands: computed('model.@each.{isEnabled,name}', function () {
    return this.get('model').filterBy('isEnabled', true).sortBy('name');
  }),
  disabledBrands: computed('model.@each.{isEnabled,name}', function () {
    return this.get('model').filterBy('isEnabled', false).sortBy('name');
  }),

  reachedLimit: computed('model', function () {
    return this.get('plan').limitFor('brands') <= this.get('model.meta.total');
  }),

  actions: {
    transitionToAddNewBrands() {
      this.transitionToRoute('session.admin.customizations.brands.new');
    },

    editBrand(brand) {
      this.transitionToRoute('session.admin.customizations.brands.edit', brand.id);
    },

    toggleEnabledProperty(brand, e) {
      e.stopPropagation();
      brand.toggleProperty('isEnabled');
      brand.save().then(() => {
        const notificationMessage = this.get('i18n').t(
          brand.get('isEnabled') ? 'admin.brands.enabled.message' : 'admin.brands.disabled.message'
        );
        this.get('notification').success(notificationMessage);
      }).catch(() => {
        brand.rollbackAttributes();
      });
    },

    makeDefault(brand, e) {
      e.stopPropagation();

      this.get('model').forEach(brand => {
        brand.set('isDefault', false);
      });
      brand.set('isDefault', true);
      brand.save().then(() => {
        const notificationMessage = this.get('i18n').t('admin.brands.default.message');
        this.get('notification').success(notificationMessage);
        this.get('model').update();
      });
    },

    delete(brand, e) {
      e.preventDefault();
      e.stopPropagation();
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'admin.brands.delete.message'
      })
        .then(() => brand.destroyRecord())
        .then(() => {
          let msg = this.get('i18n').t('admin.brands.deleted.message');
          this.get('notification').success(msg);
        });
    }
  }
});
