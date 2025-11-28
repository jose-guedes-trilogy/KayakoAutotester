import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, observer } from '@ember/object';

export default Component.extend({
  tagName: '',

  store: service(),
  notification: service(),
  i18n: service(),

  isVisible: false,
  currentPage: 1,
  pageSize: 10,
  totalCount: 0,
  loadingPage: -1,

  conversations: [],

  groupedConversations: computed('conversations.@each.status', function() {
    const conversations = this.get('conversations') || [];
    const groups = conversations.reduce((acc, conversation) => {
      const status = conversation.get('status');
      const key = status === 'open' ? 'open' : 'closed';
      acc[key].push(conversation);
      return acc;
    }, { open: [], closed: [] });

    return {
      open: groups.open,
      closed: groups.closed,
      hasOpen: groups.open.length > 0,
      hasClosed: groups.closed.length > 0
    };
  }),

  case: null,

  didInsertElement() {
    this._super(...arguments);
    this.loadConversations(1);
  },

  async loadConversations(page) {
    try {
      this.set('loadingPage', page);
      const offset = (page - 1) * this.pageSize;
      const limit = this.pageSize;
      const sideConversations = await this.get('store').query('side-conversation', {
        caseId: this.get('case.id'), offset: offset, limit: limit
      });
      this.set('conversations', sideConversations);
      this.set('totalCount', sideConversations.meta.total);
      this.set('currentPage', page);
    } catch (error) {
      this.get('notification').error(this.get('i18n').t('generic.generic_error'));
    } finally {
      this.set('loadingPage', -1);
    }
  },

  isCaseIdChanged: observer('case.id', function() {
    this.set('currentPage', 1);
    this.loadConversations(1);
  }),

  shouldRefetchConversationsObserver: observer('shouldRefetchConversations', function() {
    if (this.get('shouldRefetchConversations')) {
      const currentPage = this.get('currentPage');
      this.loadConversations(currentPage);
      setTimeout(() => {
        this.get('refetchConversations')(false);
      });
    }
  }),

  // Computed property to determine which pages to display for pagination
  visiblePages: computed('currentPage', 'totalPages', function() {
    const totalPages = this.get('totalPages');
    const currentPage = this.get('currentPage');
    const maxPages = 5;
    let startPage, endPage;

    if (totalPages <= maxPages) {
      // Total pages less than max, so show all pages
      startPage = 1;
      endPage = totalPages;
    } else {
      // More than max pages, so calculate start and end pages
      let middle = Math.floor(maxPages / 2);
      if (currentPage <= middle) {
        startPage = 1;
        endPage = maxPages;
      } else if (currentPage + middle >= totalPages) {
        startPage = totalPages - maxPages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - middle;
        endPage = currentPage + middle;
      }
    }
    return Array.from({ length: (endPage - startPage + 1) }, (_, i) => startPage + i);
  }),

  totalPages: computed('totalCount', 'pageSize', function() {
    return Math.max(1, Math.ceil(this.get('totalCount') / this.get('pageSize')));
  }),

  actions: {
    previousPage() {
      if (this.get('currentPage') > 1) {
        const prevPage = this.get('currentPage') - 1;
        this.loadConversations(prevPage);
      }
    },
    firstPage() {
      if (this.get('currentPage') === 1) {
        return;
      }
      this.loadConversations(1);
    },
    goToPage(page) {
      if (page === this.get('currentPage')) {
        return;
      }
      this.loadConversations(page);
    },
    nextPage() {
      if (this.get('currentPage') < this.get('totalPages')) {
        const nextPage = this.get('currentPage') + 1;
        this.loadConversations(nextPage);
      }
    },
    goToLastPage() {
      if (this.get('currentPage') === this.get('totalPages')) {
        return;
      }
      const lastPage = this.get('totalPages');
      this.loadConversations(lastPage);
    },
  }
});
