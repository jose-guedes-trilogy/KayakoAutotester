import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('field'), {
  customFields: service(),

  model(params) {
    return this.store.createRecord('organization-field', { fieldType: params.type });
  },

  afterModel(field) {
    this.get('customFields').ensureLocaleFieldsAndOptions(field);
  },

  setupController(controller, field) {
    controller.setProperties({ field });
    controller.initEdits();
  }
});
