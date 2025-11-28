import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  customFields: service(),

  model(params) {
    return this.store.findRecord('case-field', params.case_field_id);
  },

  afterModel(field) {
    this.get('customFields').ensureLocaleFieldsAndOptions(field);
    const fieldType = field.get('fieldType');

    switch (fieldType) {
      case 'PRIORITY':
        return field.get('priorities');
      case 'STATUS':
        return field.get('statuses');
      case 'TYPE':
        return field.get('types');
    }
  },

  setupController(controller, field) {
    controller.setProperties({ field });
    controller.initEdits();
  }
});
