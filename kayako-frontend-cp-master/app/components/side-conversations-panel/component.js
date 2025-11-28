import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, observer } from '@ember/object';

const VIEW_TYPES = Object.freeze({
  CONVERSATIONS_LIST: 'CONVERSATIONS_LIST',
  NEW_CONVERSATION: 'NEW_CONVERSATION',
  INDIVIDUAL_CONVERSATION: 'INDIVIDUAL_CONVERSATION'
});

export default Component.extend({
  tagName: '',

  // services
  i18n: service(),

  isVisible: false,
  isAddingNewConversation: false,
  currentConversation: null,
  shouldRefetchConversations: false,

  currentView: computed('currentConversation.id', function() {
    return this.get('currentConversation.id') ? VIEW_TYPES.INDIVIDUAL_CONVERSATION : VIEW_TYPES.CONVERSATIONS_LIST;
  }),

  isVisibleChanged: observer('isVisible', function() {
    if (this.get('isVisible')) {
      this.send('refetchConversations', true);
    }
  }),
  
  actions: {
    refetchConversations(value) {
      this.set('shouldRefetchConversations', value);
    },
    openConversation(conversation) {
      this.send('setView', VIEW_TYPES.INDIVIDUAL_CONVERSATION);
      this.set('currentConversation', conversation);
    },
    openPanel() {
      this.set('isVisible', true);
    },
    closePanel() {
      this.set('isVisible', false);
    },
    setView(viewType) {
      if (Object.values(VIEW_TYPES).includes(viewType)) {
        this.set('currentView', viewType);
        if (viewType !== VIEW_TYPES.INDIVIDUAL_CONVERSATION) {
          this.set('currentConversation', null);
        }
      }
    }
  }
});
