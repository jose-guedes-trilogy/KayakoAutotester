import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { get } from '@ember/object';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

export default Route.extend({
  timelineService: service('timeline'),
  store: service(),

  model(params) {
    const caseModel = this.modelFor('session.agent.cases.new');
    const requester = get(caseModel, 'requester');
    const organization = requester ? requester.get('organization') : null;
    const timelineService = this.get('timelineService');
    return RSVP.hash({
      case: caseModel,
      organization,
      caseFields: this.get('store').findAll('case-field'),
    })
    .then(data => {
      data.timeline = timelineService.timelineForCaseOrganization(data.case, data.organization);
      return data;
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
    let parentController = this.controllerFor('session.agent.cases.new');
    const tab = parentController.get('tab');
    const OrganizationStateManager = getOwner(this).factoryFor('state-manager:organization');
    const state = OrganizationStateManager.create({organization: models.organization, tab});
    controller.set('state', state);
  }
});
