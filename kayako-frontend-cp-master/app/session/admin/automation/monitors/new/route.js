import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

import { variation } from 'ember-launch-darkly';

export default Route.extend(DirtyAwareRoute('model'), {
  i18n: service(),
  notification: service(),
  metrics: service(),

  model() {
    const store = this.get('store');

    return store.createRecord('monitor', {
      actions: [store.createRecord('automation-action')],
      isEnabled: true
    });
  },

  setupController(controller, model) {
    model.get('predicateCollections').createRecord({
      propositions: [this.get('store').createRecord('proposition')]
    });
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
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'monitor_created',
        });
      }
      this.transitionTo('session.admin.automation.monitors');
    },

    cancel() {
      this.transitionTo('session.admin.automation.monitors');
    }
  }
});
