import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';

export default Route.extend(DirtyAwareRoute(), {
  agentCache: service('cache/agent-cache'),

  model(params) {
    const store = this.get('store');
    const agentCache = this.get('agentCache');
    return RSVP.hash({
      definitions: store.query('definition', { type: 'engagement' }),
      automationActionDefinitions: store.query('automation-action-definition', { type: 'engagement' }),
      theVisitorEngagement: this.store.findRecord('engagement', params.engagement_id),
      teams: store.findAll('team'),
      agents: agentCache.getAgents()
    });
  },

  setupController(controller, model) {
    controller.setProperties(model);
    controller.setProperties(this.modelFor('session.admin.messenger.engagements'));
  },

  // Actions
  actions: {
    didSave() {
      this.transitionTo('session.admin.messenger.engagements');
    },

    cancel() {
      this.transitionTo('session.admin.messenger.engagements');
    }
  }
});
