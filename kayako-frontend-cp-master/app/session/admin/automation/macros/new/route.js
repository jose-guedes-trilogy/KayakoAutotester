import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute('model'), {
  store: service(),

  model() {
    return this.get('store').createRecord('macro');
  },

  setupController(controller, model) {
    this._super(...arguments);

    controller.set('referenceData', this.controllerFor('session.admin.automation.macros').get('referenceData'));
    controller.initEdits();
  }
});
