import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { notEmpty } from '@ember/object/computed';
import EmberObject from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { run } from '@ember/runloop';
import jQuery from 'jquery';
import { task } from 'ember-concurrency';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import config from 'frontend-cp/config/environment';
import { observer } from '@ember/object';
import computeSelected from 'frontend-cp/utils/compute-selected';
import { variation } from 'ember-launch-darkly';

const columns = {
  CASES: [
    'convComposite',
    'casestatusid',
    'casepriorityid',
    'updatedat'
  ],

  USERS: [
    'userComposite',
    'lastActivityAt'
  ],

  ORGANIZATIONS: [
    'orgComposite',
    'updatedat'
  ]
};

export default Controller.extend({
  // Services
  store: service(),
  metrics: service(),
  advancedSearch: service(),
  i18n: service(),
  notification: service(),
  bulkService: service('case-bulk-update'),
  permissions: service(),
  confirmation: service(),
  mergeConversation: service(),

  queryParams: ['page', {
    group: {
      scope: 'controller'
    }
  }],

  // Attributes
  group: 'CASES',
  page: 1,

  // State
  searchTerm: '',
  openInANewTab: false,
  preventFocus: false,
  isDirty: false,
  isSomeChecked: notEmpty('selectedCaseIds'),
  isUpdatingCases: false,
  selectedCaseIds: computed(() => []),
  showResults: true,
  transition: null,
  tabIndex: null,

  // CPs
  hasPermissionToTrashCases: computed(function() {
    return this.get('permissions').has('cases.trash');
  }),

  inputID: computed(function() {
    return `ko-${guidFor(this)}`;
  }),

  results: computed.readOnly('search.lastSuccessful.value'),

  teams: computed(function () {
    return this.get('store').peekAll('team');
  }),

  selectedCases: computed.alias('selectedCaseIds'),

  isEverythingChecked: computed('searchResults.length', 'selectedCaseIds.length', function() {
    let searchResults = this.get('searchResults.length');
    let selectedCaseIds = this.get('selectedCaseIds.length');

    return searchResults === selectedCaseIds;
  }),

  totalCounts: computed('results', 'showResults', function() {
    const results = this.get('results');
    const showResults = this.get('showResults');

    if (results) {
      const totalCounts = EmberObject.create({});

      Object.keys(results).forEach(res => {
        if (showResults) {
          totalCounts.set(res, results.get(res).total);
        } else {
          totalCounts.set(res, 0);
        }
      });
      return totalCounts;
    }
  }),

  totalPages: computed('results', 'group', function() {
    const group = this.get('group');
    if (this.get('results')) {
      return this.get('results').get(group).totalPages;
    }
  }),

  searchResults: computed('results', 'group', function() {
    const store = this.get('store');
    const group = this.get('group');
    if (this.get('results')) {
      const results = this.get('results').get(group).results;
      return results.map(res => {
        return store.peekRecord(res.resource, res.id);
      });
    }
  }),

  columnList: computed('group', function() {
    return columns[this.get('group')];
  }),

  maxWidthForColumn(column) {
    if (column === 'convComposite' || column === 'userComposite' || column === 'orgComposite' || column === 'fullname' || column === 'name') {
      return null;
    } else if (column === 'userAvatar' || column === 'organizationAvatar') {
      return 65;
    } else if (column === 'id') {
      return 60;
    } else {
      return 150;
    }
  },

  minWidthForColumn(column) {
    if (column === 'convComposite' || column === 'userComposite' || column === 'orgComposite') {
      return 300;
    } else if (column === 'fullname' || column === 'name') {
      return 200;
    } else if (column === 'userAvatar' || column === 'organizationAvatar') {
      return 65;
    } else {
      return 60;
    }
  },

  focusInput() {
    if (this.get('preventFocus')) {
      this.set('preventFocus', false);
    } else {
      run.scheduleOnce('afterRender', this, function () {
        jQuery(`#${this.get('inputID')}`).focus();
      });
    }
  },

  isSearchRunning: observer('search.isRunning', function () {
    this.set('showResults', !this.get('search.isRunning'));
  }),

  // Tasks
  search: task(function * () {
    const searchTerm = this.get('searchTerm');
    const currentPage = parseInt(this.get('page'), 10) || 1;
    const pageLimit = config.casesPageSize;
    const offset = (pageLimit * currentPage) - pageLimit;
    return yield this.get('advancedSearch').search(searchTerm, offset, pageLimit);
  }),

  mergeCases: task(function * () {
    let store = this.get('store');
    let mergeConversation = this.get('mergeConversation');
    let ids = this.get('selectedCaseIds');
    let cases = ids.map(id => store.peekRecord('case', id));
    let skipSelection = true;

    try {
      this.set('isUpdatingCases', true);

      yield mergeConversation.confirm({ cases, skipSelection });

      yield this.get('search').perform();

      this.set('selectedCaseIds', []);
    } finally{
      this.set('isUpdatingCases', false);
    }
  }).drop(),

  actions: {
    selectAll() {
      this.set('selectedCaseIds', this.get('searchResults').mapBy('id'));
    },

    deselectAll() {
      this.set('selectedCaseIds', []);
    },

    showResultGroup(group) {
      this.set('preventFocus', true);
      this.transitionToRoute('session.agent.search', this.get('searchTerm'), {
        queryParams: {
          page: 1,
          group
        }
      });
    },

    openResult(resultGroup, result, hasModifier) {
      if (variation('ops-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'Search - Open a result',
          category: 'Agent'
        });
      }

      const routes = {
        USERS: 'session.agent.users.user',
        CASES: 'session.agent.cases.case',
        ORGANIZATIONS: 'session.agent.organizations.organization'
      };

      const route = routes[resultGroup];

      this.send('openSearchResult', route, result, hasModifier);
    },

    inputKeyDown(e) {
      switch (e.keyCode) {
        case KeyCodes.enter: {
          this.set('isDirty', true);
          this.transitionToRoute('session.agent.search', this.get('searchTerm'), {
            queryParams: {
              page: 1,
              group: 'CASES'
            }
          });
          e.preventDefault();
          break;
        }
      }
    },


    toggleCheck(rowCase, checked, shiftKey) {
      const selectedCaseIds = this.get('selectedCaseIds');

      if (shiftKey && selectedCaseIds.length) {
        const allCaseIds = this.get('searchResults').mapBy('id');
        const selectedRows = computeSelected(rowCase.id, checked, selectedCaseIds, allCaseIds);
        this.set('selectedCaseIds', selectedRows);
        return;
      }

      if (checked) {
        selectedCaseIds.pushObject(rowCase.id);
      } else {
        selectedCaseIds.removeObject(rowCase.id);
      }
    },

    bulkUpdateComplete() {
      this.get('search').perform();
      this.send('clearSelectedCaseIds');
    },

    clearSelectedCaseIds() {
      this.set('selectedCaseIds', []);
    },

    trashCases() {
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'generic.confirm.trashcases'
      }).then(() => {
        this.set('isUpdatingCases', true);
        return this.get('bulkService').trashCases(this.get('selectedCaseIds')).then((notificationResponse) => {
          if (!(notificationResponse.notifications && notificationResponse.notifications[0].type === 'ERROR')) {
            this.get('notification').success(this.get('i18n').t('generic.casestrashed'));
            this.get('search').perform();
          }
        }).catch(() => {
          this.get('notification').error(this.get('i18n').t('generic.case_trashing_failed'));
        });
      }).finally(() => this.set('isUpdatingCases', false));
    }
  }
});
