import Controller from '@ember/controller';

export default Controller.extend({
  queryParams: ['postId', 'filter'],
  filter: 'notes',
  postId: null,

  actions: {
    updateQueryParams(changes) {
      this.setProperties(changes);
      return true;
    }
  }
});
