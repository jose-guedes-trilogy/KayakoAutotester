import TabbedRoute from 'frontend-cp/routes/abstract/tabbed-route';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';
import RSVP from 'rsvp';

export default TabbedRoute.extend({
  processManager: service(),

  model(params) {
    return this.store.findRecord('user', params.user_id);
  },

  afterModel(model, transition) {
    let processManager = this.get('processManager');
    let process = processManager.getOrCreateProcess(model, 'user');
    processManager.setForegroundProcess(process);

    let tabStore = this.get('tabStore');
    let { tags } = model.getProperties('tags');
    let tab = this.retrieveTab(transition);

    tabStore.update(tab, { process });
    tabStore.set('activeTab', tab);
    this.set('tab', tab);

    return RSVP.resolve(tags).then(() => {
      let state = process.get('state');

      if (!state) {
        const UserStateManager = getOwner(this).factoryFor('state-manager:user');
        state = UserStateManager.create({user: model, tab});
        process.set('state', state);
      }

      this.set('state', state);
    });
  },

  retrieveTab(transition) {
    let newUserController = this.controllerFor('session.agent.users.new.index');
    let tabStore = this.get('tabStore');

    if (!newUserController.get('openInSameTab')) {
      return tabStore.open(transition);
    }

    let state = tabStore.decomposeTransition(transition);
    let transitionTabPath = newUserController.get('transitionTabPath');
    let tab = tabStore.getTab(transitionTabPath);

    newUserController.set('openInSameTab', false);
    newUserController.set('transitionTabPath', null);

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
      processManager.setForegroundProcess(null);

      this._super(...arguments);
    }
  }
});
