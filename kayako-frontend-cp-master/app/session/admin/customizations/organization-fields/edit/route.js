import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  customFields: service(),

  model(params) {
    return this.store.findRecord('organization-field', params.organization_field_id);
  },

  afterModel(field) {
    this.get('customFields').ensureLocaleFieldsAndOptions(field);
  },

  setupController(controller, field) {
    controller.setProperties({ field });
    controller.initEdits();
  }
});
