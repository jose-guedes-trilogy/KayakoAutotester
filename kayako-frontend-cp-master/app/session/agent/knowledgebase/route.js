import { inject as service } from '@ember/service';
import { hash } from 'rsvp';
import Route from '@ember/routing/route';

export default Route.extend({
  articleEvents: service(),
  notification: service('notification'),
  i18n: service(),
  session: service(),
  
  init() {
    this._super(...arguments);
    this.get('articleEvents').setArticleCreatedCallback(() => {
      this.refresh();
    });
    this.get('articleEvents').setArticleUpdatedCallback(() => {
      this.refresh();
    });
    this.get('articleEvents').setArticleDeletedCallback(() => {
      this.refresh();
    });
  },

  async model(params) {
    const adapter = this.store.adapterFor('article');
    const articleCounts = await adapter.fetchArticleCounts();

    return hash({ 
        articleCounts: articleCounts
    });
  }
});
