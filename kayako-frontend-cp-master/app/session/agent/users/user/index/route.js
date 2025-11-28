import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import TabbedRouteChild from 'frontend-cp/routes/abstract/tabbed-route-child';

export default TabbedRouteChild.extend({
  store: service(),
  timelineService: service('timeline'),
  queryParams: {
    timestamp: {
      refreshModel: true
    }
  },

  model({ timestamp }) {
    const store = this.get('store');
    const user = this.modelFor('session.agent.users.user');
    const timelineService = this.get('timelineService');

    return RSVP.hash({
      timeline: timelineService.timelineForUser(user),
      statuses: store.findAll('case-status'),
      caseFields: store.findAll('case-field'),
      user,
      timestamp
    });
  },

  setupController(controller, models) {
    let parentController = this.controllerFor('session.agent.users.user');
    controller.set('state', parentController.get('state'));
    controller.setProperties(models);
  }
});
