import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import TabbedRouteChild from 'frontend-cp/routes/abstract/tabbed-route-child';
import { getOwner } from '@ember/application';

export default TabbedRouteChild.extend({
  timelineService: service('timeline'),

  queryParams: {
    timestamp: { refreshModel: true },
  },

  cleanUpDeletedOrganizationFromUI() {
    this.modelFor('session.agent.cases.case').set('requester.organization', null);
  },

  beforeModel() {
    return this.get('store').findAll('organization-field');
  },

  model({ timestamp }) {
    const store = this.get('store');
    const caseModel = this.modelFor('session.agent.cases.case');
    const timelineService = this.get('timelineService');
    let organization = null;

    // First try to get organization from case
    if (caseModel.get('organization').get('id')) {
      organization = caseModel.get('organization');
    } else if (caseModel.get('requester')) {
      // If no organization in case, try to get it from requester
      organization = caseModel.get('requester.organization');
    }

    return RSVP.resolve(organization)
      .then(organization => {
        return RSVP.hash({
          timeline: timelineService.timelineForCaseOrganization(caseModel, organization),
          statuses: store.findAll('case-status'),
          caseFields: store.findAll('case-field'),
          case: caseModel,
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

  activate() {
    const organization = this.modelFor(this.routeName).organization;
    if (organization) {
      organization.on('didDelete', this, this.cleanUpDeletedOrganizationFromUI);
    }
  },

  deactivate() {
    const organization = this.modelFor(this.routeName).organization;
    if (organization) {
      organization.off('didDelete', this, this.cleanUpDeletedOrganizationFromUI);
    }
  },

  setupController(controller, models) {
    controller.setProperties(models);
    let parentController = this.controllerFor('session.agent.cases.case');
    const tab = parentController.get('tab');
    const OrganizationStateManager = getOwner(this).factoryFor('state-manager:organization');
    const state = OrganizationStateManager.create({organization: models.organization, tab});
    controller.set('state', state);
  }
});
