import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';

import { variation } from 'ember-launch-darkly';

export default Route.extend(DirtyAwareRoute('theVisitorEngagement'), {

  agentCache: service('cache/agent-cache'),
  metrics: service(),

  model() {
    const store = this.get('store');
    const agentCache = this.get('agentCache');

    return RSVP.hash({
      definitions: store.query('definition', { type: 'engagement' }),
      automationActionDefinitions: store.query('automation-action-definition', { type: 'engagement' }),
      theVisitorEngagement: store.createRecord('engagement', {
        actions: [store.createRecord('automation-action')],
        isEnabled: true
      }),
      teams: store.findAll('team'),
      agents: agentCache.getAgents()
    });
  },

  setupController(controller, { theVisitorEngagement, teams, agents, definitions, automationActionDefinitions }) {
    theVisitorEngagement.get('predicateCollections').createRecord({
      propositions: [this.get('store').createRecord('proposition')],
      showAddNewCondition: true,
      definitions: this.get('store').peekAll('definition').filter(definition => { return definition.get('group') === 'ENGAGEMENT'; })
    });
    controller.setProperties({ theVisitorEngagement, teams, agents, definitions, automationActionDefinitions });
    controller.setProperties(this.modelFor('session.admin.messenger.engagements'));
  },

  // Actions
  actions: {
    didSave() {
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'engagement_rule_created',
          name: this.get('controller').get('theVisitorEngagement.title'),
        });
      }
      this.transitionTo('session.admin.messenger.engagements');
    },

    cancel() {
      this.transitionTo('session.admin.messenger.engagements');
    }
  }
});
