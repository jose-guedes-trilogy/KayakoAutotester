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
    const organization = this.modelFor('session.agent.organizations.organization');
    const timelineService = this.get('timelineService');

    return RSVP.hash({
      timeline: timelineService.timelineForOrganization(organization),
      statuses: store.findAll('case-status'),
      caseFields: store.findAll('case-field'),
      organization,
      timestamp
    });
  },

  setupController(controller, models) {
    let parentController = this.controllerFor('session.agent.organizations.organization');
    controller.set('state', parentController.get('state'));
    controller.setProperties(models);
  }
});
