import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { inject as service } from '@ember/service';

export default Route.extend({
  store: service(),
  session: service(),
  locale: service(),

  async model(params) {
    const articleId = params.id;
    const articleAdapter = this.store.adapterFor('article');
    const article = await articleAdapter.fetchArticleById(articleId);

    const defaultLocale = this.get('locale.accountDefaultLocaleCode');
    const userLocale = this.get('session.user.locale.locale');
    
    let titleObj = article.titles.find(t => t.locale === defaultLocale) ||
                   article.titles.find(t => t.locale === userLocale) ||
                   article.titles[0];
    article.title = titleObj.translation;

    let contentObj = article.contents.find(c => c.locale === defaultLocale) ||
                     article.contents.find(c => c.locale === userLocale) ||
                     article.contents[0];
    article.content = contentObj.translation;

    return hash({
      article
    });
  },

  actions: {
    refreshRoute() {
      this.refresh().then(() => {
        const controller = this.controllerFor(this.routeName);
        controller.set('isArticleLoading', false);
      });
    }
  }
});
