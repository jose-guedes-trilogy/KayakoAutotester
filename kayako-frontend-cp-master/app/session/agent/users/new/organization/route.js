import RSVP from 'rsvp';
import TabbedRouteChild from 'frontend-cp/routes/abstract/tabbed-route-child';
import { getOwner } from '@ember/application';

export default TabbedRouteChild.extend({
  model() {
    const user = this.modelFor('session.agent.users.new');
    const organization = user ? user.get('organization') : null;

    return RSVP.hash({
      user,
      organization
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

  setupController(controller, models) {
    controller.setProperties(models);
    let parentController = this.controllerFor('session.agent.users.new');
    const tab = parentController.get('tab');
    const OrganizationStateManager = getOwner(this).factoryFor('state-manager:organization');
    const state = OrganizationStateManager.create({organization: models.organization, tab});
    controller.set('state', state);
  }
});
