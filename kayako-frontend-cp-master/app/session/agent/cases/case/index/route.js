import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import TabbedRouteChild from 'frontend-cp/routes/abstract/tabbed-route-child';

export default TabbedRouteChild.extend({
  tabStore: service(),
  agentCache: service('cache/agent-cache'),
  casePriorityCache: service('cache/case-priority'),
  timelineService: service('timeline'),

  queryParams: {
    postId: { replace: true },
    filter: { replace: true, refreshModel: true },
    noteId: { replace: true, refreshModel: true }
  },

  model({ filter, noteId }) {
    const caseModel = this.modelFor('session.agent.cases.case');
    const store = this.get('store');
    const agentCache = this.get('agentCache');
    const casePriorityCache = this.get('casePriorityCache');

    const timelineService = this.get('timelineService');
    let timeline = timelineService.timelineForCase(caseModel, filter);

    return RSVP.hash({
      case: caseModel,
      priorities: casePriorityCache.getAll(),
      statuses: store.findAll('case-status'),
      types: store.findAll('case-type'),
      caseFields: store.findAll('case-field'),
      caseForms: store.findAll('case-form'),
      agents: agentCache.getAgents(),
      teams: store.findAll('team'),
      timeline,
      noteId
    });
  },

  setupController(controller, models) {
    const parentController = this.controllerFor('session.agent.cases.case');
    controller.set('state', parentController.get('state'));
    controller.setProperties(models);
  },

  // Actions
  actions: {
    updateQueryParams(changes) {
      const tabs = this.get('tabStore');
      const activeTab = tabs.get('activeTab');
      const defaultQPs = {postId: null, filter: 'all', noteId: null};
      const newQueryParams = Object.assign({}, defaultQPs, activeTab.queryParams || {}, changes);
      tabs.update(activeTab, { queryParams: newQueryParams });
    }
  }
});
