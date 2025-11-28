import Service from '@ember/service';

export default Service.extend({
  triggerArticleCreated: null,
  triggerArticleUpdated: null,
  triggerArticleDeleted: null,

  setArticleCreatedCallback(callback) {
    this.set('triggerArticleCreated', callback);
  },

  setArticleUpdatedCallback(callback) {
    this.set('triggerArticleUpdated', callback);
  },

  setArticleDeletedCallback(callback) {
    this.set('triggerArticleDeleted', callback);
  },

  articleCreated() {
    if (this.get('triggerArticleCreated')) {
      this.get('triggerArticleCreated')();
    }
  },

  articleUpdated() {
    if (this.get('triggerArticleUpdated')) {
      this.get('triggerArticleUpdated')();
    }
  },

  articleDeleted() {
    if (this.get('triggerArticleDeleted')) {
      this.get('triggerArticleDeleted')();
    }
  }
});
