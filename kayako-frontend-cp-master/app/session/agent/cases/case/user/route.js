import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import TabbedRouteChild from 'frontend-cp/routes/abstract/tabbed-route-child';
import { getOwner } from '@ember/application';

export default TabbedRouteChild.extend({
  store: service(),
  timelineService: service('timeline'),
  queryParams: {
    timestamp: {
      refreshModel: true,
    }
  },

  beforeModel() {
    return this.get('store').findAll('user-field');
  },

  model({ timestamp }) {
    const store = this.get('store');
    const caseModel = this.modelFor('session.agent.cases.case');
    const partiallyLoadedRequester = caseModel.get('requester');
    const timelineService = this.get('timelineService');

    return store.findRecord('user', partiallyLoadedRequester.get('id'))
      .then(user => {
        return RSVP.hash({
          timeline: timelineService.timelineForCaseUser(caseModel, user),
          statuses: store.findAll('case-status'),
          caseFields: store.findAll('case-field'),
          case: caseModel,
          user,
          timestamp
        });
      });
  },

  afterModel({ user }) {
    return user.get('tags');
  },

  setupController(controller, models) {
    controller.setProperties(models);
    let parentController = this.controllerFor('session.agent.cases.case');
    const tab = parentController.get('tab');
    const UserStateManager = getOwner(this).factoryFor('state-manager:user');
    const state = UserStateManager.create({user: models.user, tab});
    controller.set('state', state);
  }
});
