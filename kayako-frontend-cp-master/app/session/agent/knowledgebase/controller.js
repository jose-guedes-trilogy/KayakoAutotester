import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Controller.extend({
  selectedStatus: 'ALL',
  router: service(),

  queryParams: {
    currentPage: 'page'
  },
  currentPage: 1,

  isIndexRoute: computed('router.currentRouteName', function() {
    return this.get('router.currentRouteName') === 'session.agent.knowledgebase.index';
  }),

  totalCount: computed('model.articleCounts', 'selectedStatus', function() {
    const articleCounts = this.get('model.articleCounts');
    const selectedStatus = this.get('selectedStatus');

    if (selectedStatus === 'ALL') {
      return articleCounts.allCount;
    } else if (selectedStatus === 'PUBLISHED') {
      return articleCounts.myPublishedCount;
    } else if (selectedStatus === 'DRAFT') {
      return articleCounts.draftCount;
    } else {
      return 0;
    }
  }),

  actions: {
    filterByStatus(status) {
      this.set('selectedStatus', status);
      this.transitionToRoute('session.agent.knowledgebase.index');
    }
  }
});
