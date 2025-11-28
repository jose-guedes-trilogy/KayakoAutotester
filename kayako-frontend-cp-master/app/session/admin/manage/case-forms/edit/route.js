import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  store: service(),

  model(params) {
    let store = this.get('store');

    return RSVP.hash({
      brands: store.findAll('brand'),
      caseForm: store.findRecord('case-form', params.case_form_id),
      // we need all fields, even the ones that haven't been added to a form
      caseFields: store.query('case-field', { include: []})
    });
  },

  afterModel(model) {
    if (model.caseForm.get('isDeleted')) {
      this.transitionTo('session.admin.manage.case-forms.index');
      return;
    }

    let store = this.get('store');
    let locales = store.peekAll('locale').filterBy('isPublic', true);
    let customerTitles = model.caseForm.get('customerTitles');
    let descriptions = model.caseForm.get('descriptions');

    // HOTFIX FT-1897
    // Remove any fields that don’t appear in model.caseFields (the canonical list).
    // They are soft-deleted and showing up by mistake.
    //
    // Note also: the form’s case-fields are side-loaded for now, until the backend
    // is patched such that it does not include soft-deleted fields in the form’s
    // “fields” list.
    //
    // If and when PDM-9524 lands, we can revert this out.
    let filteredFields = model.caseForm.get('fields').filter(field => model.caseFields.includes(field));
    model.caseForm.set('fields', filteredFields);

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

  setupController(controller, props) {
    controller.setProperties(props);
    controller.initEdits();
  }
});
