import { hash } from 'rsvp';
import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  model(params) {
    return hash({
      channels: this.store.findAll('trigger-channel'),
      theTrigger: this.store.findRecord('trigger', params.trigger_id)
    });
  },

  setupController(controller, model) {
    controller.setProperties(model);
    controller.setProperties(this.modelFor('session.admin.automation.triggers'));
  },

  // Actions
  actions: {
    didSave() {
      this.transitionTo('session.admin.automation.triggers');
    },

    cancel() {
      this.transitionTo('session.admin.automation.triggers');
    }
  }
});
