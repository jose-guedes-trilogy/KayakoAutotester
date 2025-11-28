import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  i18n: service(),
  notification: service(),

  model(params) {
    return this.get('store').findRecord('monitor', params.monitor_id);
  },

  setupController(controller) {
    this._super(...arguments);
    controller.setProperties(this.modelFor('session.admin.automation.monitors'));
  },

  // Actions
  actions: {
    didSave() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });
      this.transitionTo('session.admin.automation.monitors');
    },

    cancel() {
      this.transitionTo('session.admin.automation.monitors');
    }
  }
});
