import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';

export default Route.extend({
  tabStore: service(),
  store: service(),
  timelineService: service('timeline'),

  model() {
    const caseModel = this.modelFor('session.agent.cases.new');
    const timelineService = this.get('timelineService');
    let requester;
    if (caseModel.get('requester.id')) {
      requester = caseModel.get('requester');
    }
    else if (this.get('tabStore.activeTab.state.case.requesterId')) {
      let id = this.get('tabStore.activeTab.state.case.requesterId');
      requester = this.get('store').findRecord('user', id).then((requester) => caseModel.set('requester', requester));
    }

    return RSVP.hash({
      case: caseModel,
      user: requester,
      caseFields: this.get('store').findAll('case-field'),
    })
    .then(data => {
      data.timeline = timelineService.timelineForCaseUser(data.case, data.user);
      return data;
    });
  },

  afterModel({ user }) {
    if (user) {
      return user.get('tags');
    }
  },

  setupController(controller, models) {
    controller.setProperties(models);
    const parentController = this.controllerFor('session.agent.cases.new');
    const tab = parentController.get('tab');
    const UserStateManager = getOwner(this).factoryFor('state-manager:user');
    const state = UserStateManager.create({user: models.user, tab});
    controller.set('state', state);
  }
});
