import Component from '@ember/component';

export default Component.extend({
  selectedStatus: 'ALL',
  
  articleCounts: {
    allCount: 0,
    draftCount: 0,
    myPublishedCount: 0
  },

  init() {
    this._super(...arguments);
  },

  actions: {
    filterByStatus(status) {
      this.get('filterByStatus')(status); // Call the action passed from the parent
    }
  }
});
