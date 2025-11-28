import Controller from '@ember/controller';

export default Controller.extend({
  queryParams: ['postId', 'filter'],
  filter: 'notes',
  postId: null,
  openInSameTab: false,
  transitionTabPath: null,

  actions: {
    updateQueryParams(changes) {
      this.setProperties(changes);
      return true;
    },

    closeTab() {
      this.target.send('closeTab');
    },

    openInSameTab() {
      this.set('openInSameTab', true);
    }
  }
});
