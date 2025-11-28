import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('caseForm'), {
  store: service(),

  model() {
    let store = this.get('store');

    return RSVP.hash({
      caseForm: store.createRecord('case-form'),
      caseFields: store.query('case-field', {include: []}),
      brands: store.findAll('brand')
    }).then(model => {
      let caseFields = model.caseFields;
      let caseForm = model.caseForm;

      caseFields.forEach(field => {
        if (field.get('isSystem')) {
          caseForm.get('fields').pushObject(field);
        }
      });

      return model;
    });
  },

  afterModel(model) {
    let store = this.get('store');
    let locales = store.peekAll('locale').filterBy('isPublic', true);
    let customerTitles = model.caseForm.get('customerTitles');
    let descriptions = model.caseForm.get('descriptions');

    locales.forEach(element => {
      let locale = element.get('locale');

      if (!customerTitles.findBy('locale', locale)) {
        customerTitles.pushObject(store.createRecord('locale-field', {locale}));
      }

      if (!descriptions.findBy('locale', locale)) {
        descriptions.pushObject(store.createRecord('locale-field', {locale}));
      }
    });
  },

  setupController(controller, { brands, caseForm, caseFields }) {
    controller.setProperties({ brands, caseForm, caseFields });
    controller.initEdits();
  }
});
