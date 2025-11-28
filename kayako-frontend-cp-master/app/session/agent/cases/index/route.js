import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';

export default Route.extend({
  caseListTab: service('case-list-tab'),
  viewsCountPollingTimer: null,

  model() {
    const store = this.get('store');
    const caseListTab = this.get('caseListTab');

    return RSVP.hash({
      views: caseListTab.getViews(),
      teams: store.findAll('team')
    });
  },

  setupController(controller, {views, teams}) {
    const customViews = this.get('caseListTab.enabledViewsWithoutInbox');
    controller.setProperties({
      showingViewsList: true,
      views,
      teams,
      customViews,
      selectedCaseIds: []
    });
  },

  actions: {
    refreshCaseList() {
      this.get('caseListTab').refresh();
    }
  }
});
