import { next } from '@ember/runloop';
import EmberObject from '@ember/object';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { observer } from '@ember/object';

export default Component.extend({
  // Services
  mergeConversation: service(),
  apiAdapter: service(),
  notification: service(),
  i18n: service(),
  routing: service('-routing'),

  // State
  casesForUser: null,
  highlightedResult: null,
  isSearching: false,
  showConfirmation: false,
  selectedConversations: null,
  hasSuggestions: false,

  // Lifecycle Hooks
  init() {
    this._super(...arguments);
    this.set('selectedConversations', []);
  },

  activeMergeDidChange: observer('activeMerge', function() {
    let passed = this.get('activeMerge.selectedCases');
    let skipSelection = this.get('activeMerge.skipSelection');

    if (passed) {
      let normalized = passed.map(normalizeToMinimalCaseFormat);
      this.set('selectedConversations', normalized);
    }

    if (skipSelection) {
      this.set('showConfirmation', true);
    }
  }),

  // CP's
  activeMerge: computed.oneWay('mergeConversation.activeMerge'),

  selectedLabel: computed('activeMerge.selectedLabel', function() {
    return this.get('activeMerge.selectedLabel').toUpperCase();
  }),

  convosToBeAffected: computed('selectedConversations.[]', 'activeMerge.currentCase', function() {
    let currentCase = this._normalizeToMinimalCaseFormat(this.get('activeMerge.currentCase'));
    return [...this.get('selectedConversations'), currentCase];
  }),

  oldestCase: computed('convosToBeAffected.[]', function() {
    let items = this.get('convosToBeAffected');
    let sorted = items.sortBy('resultData.createdAt');
    return sorted[0];
  }),

  convosToBeMerged: computed('convosToBeAffected.[]', 'oldestCase', function() {
    let convosToBeAffected = this.get('convosToBeAffected');
    let oldestCaseId = this.get('oldestCase.id');

    return convosToBeAffected.filter(convo => {
      return convo.get('id') !== oldestCaseId;
    });
  }),

  searchWithinQuery: computed('activeMerge.requesterName', function() {
    return 'in:cases -status:closed';
  }),

  suggestionExclusions: computed('selectedConversations.[]', 'activeMerge.currentCase.id', function() {
    let exclusions = this.get('selectedConversations').map(convo => {
      let idUrl = convo.get('id');

      return idUrl.substr(idUrl.lastIndexOf('/') + 1);
    });

    return [...exclusions, this.get('activeMerge.currentCase.id')];
  }),

  searchExclusions: computed('selectedConversations.[]', 'activeMerge.currentCase.id', function() {
    let exclusions = this.get('selectedConversations').map(function(convo) {
      return {
        id: convo.get('id'),
        type: 'case'
      };
    });

    exclusions.pushObject({
      id: this.get('activeMerge.currentCase.id'),
      type: 'case'
    });

    return exclusions;
  }),

  numSelectedConversations: computed.readOnly('convosToBeMerged.length'),

  requester: computed.readOnly('activeMerge.currentCase.requester'),

  // Methods

  // Search results are a different format from suggestions
  // normalizing them before they are stored makes it easier to keep the excuded results list in sync
  _normalizeToMinimalCaseFormat(convo) {
    return normalizeToMinimalCaseFormat(convo);
  },

  // Tasks
  performMerge: task(function * () {
    let convosToBeMergedIds = this.get('convosToBeMerged').map(convo => {
      return convo.get('id');
    });
    let oldestCase = this.get('oldestCase');
    let oldestCaseId = this.get('oldestCase.id');

    try {
      yield this.get('apiAdapter').mergeCases(oldestCaseId, convosToBeMergedIds);
      this.get('mergeConversation').acceptMerge(oldestCase);
      this.get('notification').success(this.get('i18n').t('cases.merge_conversation.success_message'));
      this.set('selectedConversations', []);
      this.set('showConfirmation', false);
      if (this.get('activeMerge.currentCase.id') !== oldestCaseId) {
        this.get('routing').transitionTo('session.agent.cases.case', [oldestCaseId]);
      }
    } catch (e) {
      this.get('mergeConversation').cancelMerge(false);
      this.set('selectedConversations', []);
      this.set('showConfirmation', false);
    }
  }).drop(),

  actions: {
    updateSearchState(state) {
      this.set('isSearching', state);
    },

    highlightResult(highlightedResult) {
      this.set('highlightedResult', highlightedResult);
    },

    updateMergeList(operation, result) {
      if (operation === 'ADD') {
        this.get('selectedConversations').pushObject(this._normalizeToMinimalCaseFormat(result));
      } else {
        this.get('selectedConversations').removeObject(result);
      }
    },
    onCancel() {
      this.set('selectedConversations', []);
      this.get('mergeConversation').cancelMerge(false);
      this.set('showConfirmation', false);
    },

    onNext() {
      this.set('showConfirmation', true);
    },

    onBackFromConfirmation() {
      this.set('showConfirmation', false);
    },

    onConfirm() {
      this.get('performMerge').perform();
    },

    onFetchSuggestions(suggestions) {
      // The merge conversation option shows up on cases (open) that can show up in suggestions.
      // So if there's only one suggestion, that is the case we're on, and it's excluded from the suggestions list.
      let hasSuggestions = false;
      if (suggestions && get(suggestions, 'length') > 1) {
        hasSuggestions = true;
      } else if (suggestions === null) {
        // If `suggestions` is null, that means the suggestions haven't been fetched yet.
        // `suggestions` will be an array with length = 1 when suggestions have been fetched, but no suggestions exist.
        hasSuggestions = true;
      }
      next(()=> {
        this.set('hasSuggestions', hasSuggestions);
      });
    }
  }
});

function normalizeToMinimalCaseFormat(convo) {
  if (convo.get('subject')) { //is a full blown case resource
    return new EmberObject({
      id: convo.get('id'),
      title: convo.get('subject'),
      resource: 'case',
      resultData: {
        status: convo.get('status'),
        requester: convo.get('requester'),
        assignedAgent: convo.get('assignedAgent'),
        updatedAt: convo.get('updatedAt'),
        createdAt: convo.get('createdAt')
      }
    });
  } else { //assume it is a search result or suggestion
    return new EmberObject({
      id: convo.get('id').substr(convo.get('id').lastIndexOf('/') + 1),
      title: convo.get('title'),
      resource: 'case',
      resultData: {
        status: convo.get('resultData.status'),
        requester: convo.get('resultData.requester'),
        assignedAgent: convo.get('resultData.assignedAgent'),
        updatedAt: convo.get('resultData.updatedAt'),
        createdAt: convo.get('resultData.createdAt')
      }
    });
  }
}
