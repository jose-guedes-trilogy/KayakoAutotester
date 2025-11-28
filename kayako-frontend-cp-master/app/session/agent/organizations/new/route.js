import RSVP from 'rsvp';
import TabbedRoute from 'frontend-cp/routes/abstract/tabbed-route';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';

export default TabbedRoute.extend({
  i18n: service(),
  processManager: service(),

  model({timestamp}) {
    const newOrg = this.store.peekAll('organization').findBy('creationTimestamp', timestamp);
    if (newOrg) {
      return newOrg;
    }

    return this.store.createRecord('organization', {creationTimestamp: timestamp});
  },

  afterModel(model, transition) {
    let processManager = this.get('processManager');
    let process = processManager.getOrCreateProcess(model, 'organization-new');
    processManager.setForegroundProcess(process);

    let tabStore = this.get('tabStore');
    let tab = tabStore.open(transition);
    tabStore.update(tab, { process });

    this.set('tab', tab);

    return RSVP.hash(model.getProperties('domains', 'tags')).then(() => {
      const OrganizationStateManager = getOwner(this).factoryFor('state-manager:organization');
      const state = OrganizationStateManager.create({organization: model, tab});
      this.set('state', state);
    });
  },

  setupController(controller, model) {
    this._super(...arguments);
    controller.set('state', this.get('state'));
  },

  actions: {
    willTransition(transition) {
      const tabStore = this.get('tabStore');
      const activeTab = tabStore.get('activeTab');
      let newOrgController = this.controllerFor('session.agent.organizations.new.index');
      const openInSameTab = newOrgController.get('openInSameTab');

      // Record the current tab basePath so we can update the correct tab in `afterModel`
      if (activeTab && openInSameTab && transition.targetName === 'session.agent.organizations.organization.index') {
        newOrgController.set('transitionTabPath', activeTab.basePath);
      } else {
        newOrgController.set('openInSameTab', false);
        newOrgController.set('transitionTabPath', null);
      }
    },

    closeTab() {
      this.get('tabStore').close(this.tab);
    }
  }
});
