import { hash } from 'rsvp';
import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';
import { inject as service } from '@ember/service';

import { variation } from 'ember-launch-darkly';

export default Route.extend(DirtyAwareRoute('theTrigger'), {
  metrics: service(),
  model() {
    const store = this.get('store');

    return hash({
      channels: store.findAll('trigger-channel'),
      theTrigger: store.createRecord('trigger', {
        actions: [store.createRecord('automation-action')],
        isEnabled: true
      })
    });
  },

  setupController(controller, { channels, theTrigger }) {
    theTrigger.get('predicateCollections').createRecord({
      propositions: [this.get('store').createRecord('proposition')]
    });
    controller.setProperties({ channels, theTrigger });
    controller.setProperties(this.modelFor('session.admin.automation.triggers'));
  },

  // Actions
  actions: {
    didSave() {
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'trigger_created',
          name: this.get('controller').get('theTrigger.title')
        });
      }
      this.transitionTo('session.admin.automation.triggers');
    },

    cancel() {
      this.transitionTo('session.admin.automation.triggers');
    }
  }
});
