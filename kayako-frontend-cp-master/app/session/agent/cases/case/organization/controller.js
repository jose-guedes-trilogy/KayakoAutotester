import Controller from '@ember/controller';

export default Controller.extend({
  queryParams: ['timestamp'],
  timestamp: null,

  actions: {
    updateQueryParams(changes) {
      this.setProperties(changes);
      return true;
    }
  }
});
