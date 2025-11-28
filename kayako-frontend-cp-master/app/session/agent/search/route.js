import { inject as service } from '@ember/service';
import TabbedRoute from 'frontend-cp/routes/abstract/tabbed-route';

import EmberObject from '@ember/object';

// This route does a few complex things:
// * Runs a search based on query params, removes data and pushes resources to store
// * transitionTabPath records the path of the tab which will be updated if resusing
// * afterModel updates the tab or opens a new one depending on transitionTabPath value

export default TabbedRoute.extend({

  // Services
  router: service('-routing'),
  processManager: service(),

  // State
  transitionTabPath: null,

  queryParams: {
    group: { refreshModel: true },
    page: { refreshModel: true }
  },

  model({ term, group, page }, transition) {
    const currentHandlerInfos = transition.router.currentHandlerInfos;
    const currentRouteName = currentHandlerInfos[currentHandlerInfos.length - 1].name;
    const shouldFocus = currentRouteName !== this.get('routeName');

    const tabStore = this.get('tabStore');
    let state = tabStore.decomposeTransition(transition);

    let searchController = this.controllerFor('session.agent.search');

    if (this.get('transitionTabPath') && !tabStore.getTab(state.basePath)) {
      const tab = tabStore.getTab(this.get('transitionTabPath'));
      tabStore.update(tab, state);
      tabStore.set('activeTab', tab);
      this.tab = tab;
    } else {
      if (searchController.get('tabIndex')) {
        tabStore.set('insertTabAtIndex', searchController.get('tabIndex'));
      }
      this.tab = tabStore.open(transition, term);
      tabStore.set('insertTabAtIndex', null);
      searchController.set('tabIndex', null);
    }

    this.set('transitionTabPath', null);

    return { term, shouldFocus };
  },

  afterModel({ term }, transition) {
    let model = EmberObject.create({ id: term });
    let processManager = this.get('processManager');
    let process = processManager.getOrCreateProcess(model, 'search-results');
    processManager.setForegroundProcess(process);

    let tabStore = this.get('tabStore');

    if (this.tab.process && this.tab.process !== process) {
      processManager.destroyProcess(this.tab.process);
    }

    tabStore.update(this.tab, { process });
  },

  setupController(controller, { term, shouldFocus }) {
    controller.set('searchTerm', term);
    controller.get('search').perform();
    if (shouldFocus) {
      this.controller.focusInput();
    }
  },

  actions: {
    willTransition(transition) {
      let processManager = this.get('processManager');
      processManager.setForegroundProcess(null);

      const tabStore = this.get('tabStore');
      const activeTab = tabStore.get('activeTab');
      const openInANewTab = this.controller.get('openInANewTab');
      this.controller.get('search').cancelAll();

      // Record the current tab basePath so we can update the correct tab in `afterModel`
      if (activeTab && !openInANewTab && transition.targetName === 'session.agent.search') {
        this.set('transitionTabPath', activeTab.basePath);
      } else {
        this.controller.set('openInANewTab', false);
        this.set('transitionTabPath', null);
      }
    },

    didTransition() {
      let searchController = this.controllerFor('session.agent.search');

      const tabStore = this.get('tabStore');
      const activeTab = tabStore.get('activeTab');
      let transition = searchController.get('transition');
      let tab;

      if (transition) {
        const handlerInfos = transition.router.oldState.handlerInfos;
        const oldRouteHash = handlerInfos[handlerInfos.length - 1].params.hash;

        tab = tabStore.getTab('/agent/search-new/' + oldRouteHash);
      }

      let isDirty = this.controllerFor('session.agent.search').get('isDirty');
      let routeName = this.get('router').currentRouteName;

      if (tab && activeTab.routeName !== routeName && isDirty) {
        tabStore.close(tab);
        this.controllerFor('session.agent.search').set('isDirty', false);
        searchController.set('transition', null);
      }
      return true;
    }
  }
});
