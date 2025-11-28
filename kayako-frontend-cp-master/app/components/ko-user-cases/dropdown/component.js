import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

const ITEMS_TO_SHOW = 8;

export default Component.extend({
  tagName: '',

  // Attributes
  cases: null,
  user: null,
  case: null,
  inRecentCasesMode: false,
  showTotalCountButton: false,
  casesCount: 0,

  // Service
  routing: service('-routing'),
  store: service(),
  tabStore: service(),
  advancedSearch: service(),

  // CPs
  lastFewCases: computed('cases', function () {
    return this.get('cases').slice(0, ITEMS_TO_SHOW);
  }),

  searchString: computed('user', function () {
    return `in:conversations requester:'${this.get('user.id')}'`;
  }),

  actions: {
    openActiveCase(recentCase, dropdown, event) {
      const id = recentCase.get('id');
      const caseId = this.get('case.id');

      const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey;
      if (hasModifier && caseId !== id) {
        this.get('tabStore').createTabNextToActiveTab('session.agent.cases.case', recentCase);
      }
      else {
        dropdown.actions.close();
        this.get('tabStore').transitionAndInsertTabNextToActiveTab('session.agent.cases.case.index', [id]);
      }
    },

    openSearchTabForUserCases(dropdown) {
      dropdown.actions.close();
      this.get('tabStore').transitionAndInsertTabNextToActiveTab('session.agent.search', [this.get('searchString')]);
    }
  }
});
