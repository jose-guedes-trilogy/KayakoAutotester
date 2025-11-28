import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('brand'), {
  model(params) {
    return RSVP.hash({
      brand: this.store.createRecord('brand'),
      locales: this.store.findAll('locale'),
      defaultLocaleSetting: this.store.peekAll('setting').findBy('key', 'account.default_language')
    });
  },

  setupController(controller, model) {
    const brand = model.brand;
    brand.set('locale', model.locales.findBy('locale', model.defaultLocaleSetting.get('value')));
    brand.set('domain', 'kayako.com');
    controller.set('brand', brand);
    controller.set('locales', model.locales);
    controller.initEdits();
  }
});
