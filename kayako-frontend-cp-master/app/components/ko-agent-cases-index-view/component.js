import Component from '@ember/component';
import { run } from '@ember/runloop';
import config from 'frontend-cp/config/environment';
import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import _ from 'npm:lodash';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import { task, didCancel } from 'ember-concurrency';

const CASE_PAGE_LIMIT = config.casesPageSize;

const openSelectedCaseInBackground = {
  action: 'openSelectedCaseInBackground',
  global: false
};

export default Component.extend(KeyboardShortcuts, {
  tagName: '',

  keyboardShortcuts: {
    up: {
      action: 'focusCaseAbove',
      global: false
    },
    down: {
      action: 'focusCaseBelow',
      global: false
    },
    enter: {
      action: 'openSelectedCase',
      global: false
    },
    'ctrl+enter': openSelectedCaseInBackground,
    'shift+enter': openSelectedCaseInBackground,
    'mod+enter': openSelectedCaseInBackground
  },

  // Attrs
  page: 1,
  orderByColumn: null,
  orderBy: null,
  selectedCaseIds: null,
  currentFocusedID: null,

  // Actions
  selectedCaseIdsUpdated: () => {},
  sortList: () => {},

  // State
  casesLoading: true,
  oldQueryParams: {},
  oldView: {},

  // Services
  tabStore: service(),
  caseListTab: service('case-list-tab'),
  routing: service('-routing'),

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    this.set('selectedCaseIds', []);
  },

  didReceiveAttrs() {
    this._super(...arguments);
    let queryParams = {
      page: this.get('page'),
      orderByColumn: this.get('orderByColumn'),
      orderBy: this.get('orderBy')
    };

    const view = this.get('view');
    const caseListTab = this.get('caseListTab');

    if (this.oldView !== view || !_.isEqual(this.oldQueryParams, queryParams)) {
      this.set('casesLoading', true);
      this.set('currentFocusedID', null);
      caseListTab.getCasesForView(view, queryParams).then(() => {
        caseListTab.transitionToPreviousPageIfEmpty();
      }).catch(error => {
        if (!didCancel(error)) {
          throw error;
        }
      }).finally(() => {
        this.set('casesLoading', false);
      });
    }

    this.oldQueryParams = queryParams;
    this.oldView = view;
  },

  // Tasks
  handleRealtimeChange: task(function * () {
    yield this.get('caseListTab.fetchCases').perform();
  }).drop(),

  // CP's
  cases: readOnly('caseListTab.latestCases'),

  activeView: readOnly('caseListTab.currentView'),

  isTrash: computed('activeView.viewType', function() {
    return this.get('activeView.viewType') === 'TRASH';
  }),

  showPagination: computed.empty('selectedCaseIds'),

  totalPages: computed('cases.meta.total', function() {
    const totalCases = this.get('cases.meta.total');
    return Math.ceil(totalCases / CASE_PAGE_LIMIT);
  }),

  // Methods
  selectCase(direction) {
    const cases = this.get('cases');
    const count = cases.get('length');
    let id = this.get('currentFocusedID');
    let currentIndex = cases.getEach('id').indexOf(id);

    if (id === null) {
      id = cases.get('firstObject.id');
    }
    else if (direction === 'down') {
      id = cases.objectAt(++currentIndex % count).id;
    }
    else if (direction === 'up') {
      currentIndex = (currentIndex <= 0) ? count : currentIndex;
      id = cases.objectAt(--currentIndex % count).id;
    }
    this.set('currentFocusedID', id);
  },

  afterMerge(primaryCase) {
    let caseListTab = this.get('caseListTab');

    this.sendAction('selectedCaseIdsUpdated', []);

    run.next(() => caseListTab.refresh());
  },

  // Actions
  actions: {
    clearSelectedCaseIds() {
      this.sendAction('selectedCaseIdsUpdated', []);
    },

    transitionToCase(caseContext, hasModifier) {
      const route = 'session.agent.cases.case';

      if (hasModifier) {
        this.get('tabStore').createTab(route, caseContext);
      } else {
        this.get('routing').transitionTo(route, [caseContext.get('id')], {});
      }
    },

    sortCaseList(column, orderBy) {
      this.sendAction('sortList', orderBy, column.get('name'));
    },

    setSelectedCaseIds(checkedRows) {
      this.sendAction('selectedCaseIdsUpdated', checkedRows);
    },

    trashCases() {
      this.sendAction('selectedCaseIdsUpdated', []);
      // wrapped in next() to allow spinner to load, to so it animates
      run.next(() => { this.get('caseListTab').refresh(); });
    },

    trashAllCases() {
      // wrapped in next() to allow spinner to load, to so it animates
      run.next(() => { this.get('caseListTab').refresh(); });
    },

    focusCaseAbove() {
      this.selectCase('up');
    },

    focusCaseBelow() {
      this.selectCase('down');
    },

    openSelectedCase() {
      if (!this.get('currentFocusedID')) { return; }
      this.get('routing').transitionTo('session.agent.cases.case', [this.get('currentFocusedID')]);
    },

    openSelectedCaseInBackground() {
      const kase = this.get('cases').findBy('id', this.get('currentFocusedID'));
      if (!kase) { return; }
      this.get('tabStore').createTab('session.agent.cases.case', kase);
    }
  }
});
