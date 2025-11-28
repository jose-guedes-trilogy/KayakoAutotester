import TabbedRoute from 'frontend-cp/routes/abstract/tabbed-route';
import { inject as service } from '@ember/service';
import EmberObject from '@ember/object';

export default TabbedRoute.extend({
  isDirty: false,
  transitionTabPath: null,

  processManager: service(),

  model({ hash }) {
    return EmberObject.create({ id: hash });
  },

  afterModel(model, transition) {
    let processManager = this.get('processManager');
    let process = processManager.getOrCreateProcess(model, 'search-new');
    processManager.setForegroundProcess(process);

    let tabStore = this.get('tabStore');
    let tab = tabStore.open(transition);

    tabStore.update(tab, { process });

    this.set('tab', tab);
  },

  renderTemplate() {
    this.render('session.agent.search');
  },

  actions: {
    willTransition(transition) {
      let processManager = this.get('processManager');
      processManager.setForegroundProcess(null);

      const tabStore = this.get('tabStore');
      const activeTab = tabStore.get('activeTab');
      this.controllerFor('session.agent.search').get('search').cancelAll();

      let searchController = this.controllerFor('session.agent.search');

      if (activeTab && (transition.targetName === 'session.agent.search')) {
        searchController.set('transition', transition);

        let tabIndex = tabStore.get('tabs').indexOf(activeTab);
        searchController.set('tabIndex', tabIndex);
      }
    },

    didTransition() {
      let searchController = this.controllerFor('session.agent.search');

      //Reset Search Result entities
      searchController.set('searchTerm', '');
      searchController.set('showResults', false);
      searchController.set('tabIndex', null);

      // Ensuring search element gets focused.
      searchController.focusInput();

      return true;
    }
  }
});
