import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import { getOwner } from '@ember/application';

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
    const organization = user ? user.get('organization') : null;
    const timelineService = this.get('timelineService');

    return RSVP.resolve(organization)
      .then(organization => {
        return RSVP.hash({
          timeline: timelineService.timelineForUserOrganization(user, organization),
          statuses: store.findAll('case-status'),
          caseFields: store.findAll('case-field'),
          user,
          organization,
          timestamp
        });
      });
  },

  afterModel({ organization }) {
    if (organization) {
      return RSVP.hash({
        domains: organization.get('domains'),
        tags: organization.get('tags')
      });
    }
  },

  setupController(controller, model) {
    let { organization } = model;
    let tab = this.retrieveTab();
    let tabId = tab.basePath;
    let state = this.createStateFor(organization, tab);

    controller.setProperties(model);
    controller.set('tabId', tabId);
    controller.set('state', state);
  },

  retrieveTab() {
    let userController = this.controllerFor('session.agent.users.user');
    let tab = userController.get('tab');

    return tab;
  },

  createStateFor(organization, tab) {
    let owner = getOwner(this);
    let OrganizationStateManager = owner.factoryFor('state-manager:organization');
    let state = OrganizationStateManager.create({ organization, tab });

    return state;
  }
});
