import TabbedRoute from 'frontend-cp/routes/abstract/tabbed-route';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';

const CUSTOMER_ROLE_ID = 4;

export default TabbedRoute.extend({
  i18n: service(),
  processManager: service(),

  model({timestamp}) {
    const newUser = this.store.peekAll('user').findBy('creationTimestamp', timestamp);
    if (newUser) {
      return newUser;
    }

    return this.store.findRecord('role', CUSTOMER_ROLE_ID)
      .then(roleModel => {
        return this.store.createRecord('user', {
          role: roleModel,
          creationTimestamp: timestamp
        });
      });
  },

  afterModel(model, transition) {
    let processManager = this.get('processManager');
    let process = processManager.getOrCreateProcess(model, 'user-new');
    processManager.setForegroundProcess(process);

    let tabStore = this.get('tabStore');
    let tab = tabStore.open(transition);
    tabStore.update(tab, { process });

    this.set('tab', tab);

    const UserStateManager = getOwner(this).factoryFor('state-manager:user');
    const state = UserStateManager.create({user: model, tab});
    this.set('state', state);
  },

  setupController(controller, model) {
    this._super(...arguments);
    controller.set('state', this.get('state'));
  },

  actions: {
    willTransition(transition) {
      const tabStore = this.get('tabStore');
      const activeTab = tabStore.get('activeTab');
      let newUserController = this.controllerFor('session.agent.users.new.index');
      const openInSameTab = newUserController.get('openInSameTab');

      // Record the current tab basePath so we can update the correct tab in `afterModel`
      if (activeTab && openInSameTab && (transition.targetName === 'session.agent.users.user.index' || transition.targetName === 'session.agent.users.user.organization')) {
        newUserController.set('transitionTabPath', activeTab.basePath);
      } else {
        newUserController.set('openInSameTab', false);
        newUserController.set('transitionTabPath', null);
      }
    },

    closeTab() {
      this.get('tabStore').close(this.tab);
    }
  }
});
