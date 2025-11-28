import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  store: service(),

  model(params) {
    return this.get('store').findRecord('macro', params.macro_id);
  },

  setupController(controller, model) {
    this._super(...arguments);

    controller.set('referenceData', this.controllerFor('session.admin.automation.macros').get('referenceData'));
    controller.initEdits();
  }
});
