import EmberObject, { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { task } from 'ember-concurrency';

export default Component.extend({
  tagName: '',
  // Attrs
  requester: null,
  idsToExclude: null,
  onFetchSuggestions: () => {},

  // Services
  store: service(),
  i18n: service(),

  // State
  requesterId: null,
  casesForUser: null,
  highlightedResult: null,

  // Lifecycle Hooks
  init() {
    this._super(...arguments);
    if (!this.get('idsToExclude').length) {
      this.set('idsToExclude', []);
    }
  },

  didReceiveAttrs() {
    let currentRequesterId = this.get('requester.id');
    let previousRequesterId = this.get('requesterId');
    if (currentRequesterId !== previousRequesterId) {
      this.get('fetchCasesForUser').perform();
      this.set('requesterId', currentRequesterId);
      this.get('onFetchSuggestions')(this.get('casesForUser'));
    }
  },

  // CP's
  headingLabel: computed('requester.fullName', function() {
    return `${this.get('i18n').t('cases.merge_conversation.modal.recent_conversations_from').toUpperCase()} ${this.get('requester.fullName').toUpperCase()}`;
  }),

  suggestedConversations: computed('casesForUser.[]', 'idsToExclude.[]', function(convo) {
    let casesForUser = this.get('casesForUser');
    if (casesForUser) {
      return casesForUser.map(convo => {
        if (!this.get('idsToExclude').includes(convo.get('id'))) {
          return new EmberObject({
            id: convo.get('id'),
            title: convo.get('subject'),
            resource: 'case',
            resultData: {
              status: convo.get('status'),
              requester: convo.get('requester'),
              assignedAgent: convo.get('assignedAgent'),
              createdAt: convo.get('createdAt'),
              updatedAt: convo.get('updatedAt')
            }
          });
        }
      }).compact();
    }
  }),

  // Tasks
  fetchCasesForUser: task(function * () {
    let requesterId = this.get('requester.id');
    if (requesterId) {
      let casesForUser = yield this.get('store').query('user-case', { userId: requesterId, statuses: 'NEW, OPEN, PENDING, CUSTOM'});
      this.set('casesForUser', casesForUser);
      this.get('onFetchSuggestions')(casesForUser);
    }
  }).drop(),

  actions: {
    highlightResult(highlightedResult) {
      this.set('highlightedResult', highlightedResult);
    }
  }
});

