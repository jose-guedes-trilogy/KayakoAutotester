import { inject as service } from '@ember/service';
import TabbedRoute from 'frontend-cp/routes/abstract/tabbed-route';
import { getOwner } from '@ember/application';

import RSVP from 'rsvp';

export default TabbedRoute.extend({
  processManager: service(),

  model(params) {
    return this.store.findRecord('organization', params.organization_id);
  },

  afterModel(model, transition) {
    let processManager = this.get('processManager');
    let process = processManager.getOrCreateProcess(model, 'organization');
    processManager.setForegroundProcess(process);

    let tabStore = this.get('tabStore');
    let { domains, tags } = model.getProperties('domains', 'tags');
    let tab = this.retrieveTab(transition);

    tabStore.update(tab, { process });
    tabStore.set('activeTab', tab);
    this.set('tab', tab);

    return RSVP.hash({ domains, tags }).then(() => {
      let state = process.get('state');

      if (!state) {
        const OrganizationStateManager = getOwner(this).factoryFor('state-manager:organization');
        state = OrganizationStateManager.create({organization: model, tab});
        process.set('state', state);
      }

      this.set('state', state);
    });
  },

  retrieveTab(transition) {
    let newOrgController = this.controllerFor('session.agent.organizations.new.index');
    let tabStore = this.get('tabStore');

    if (!newOrgController.get('openInSameTab')) {
      return tabStore.open(transition);
    }

    let state = tabStore.decomposeTransition(transition);
    let transitionTabPath = newOrgController.get('transitionTabPath');
    let tab = tabStore.getTab(transitionTabPath);

    newOrgController.set('transitionTabPath', null);
    newOrgController.set('openInSameTab', false);

    tabStore.update(tab, state);

    return tab;
  },

  setupController(controller, model) {
    this._super(...arguments);
    controller.set('state', this.get('state'));
  },

  actions: {
    willTransition() {
      let processManager = this.get('processManager');
      let model = this.modelFor(this.routeName);
      if (model && model.get('isDeleted')) {
        this.get('tabStore').leave(this.tab);
        this.get('tabStore').close(this.tab);
      }

      processManager.setForegroundProcess(null);

      this._super(...arguments);
    },

    closeTab() {
      this.get('tabStore').close(this.tab);
    }
  }
});
