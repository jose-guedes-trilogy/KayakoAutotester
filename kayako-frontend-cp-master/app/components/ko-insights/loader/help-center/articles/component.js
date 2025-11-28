import ObjectProxy from '@ember/object/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';

export default Component.extend({
  tagName: '',
  insights: service(),
  store: service(),

  metricsQueryParams: null,
  articles: null,

  request: computed('metricsQueryParams', function() {
    // trigger for computed property to work for trial: false/true param
    this.get('metricsQueryParams');

    const insights = this.get('insights');
    const store = this.get('store');
    const endpoint = insights.articlesEndpoint();
    const adapter = getOwner(this).lookup('adapter:application');

    return ObjectProxy.extend(PromiseProxyMixin).create({
      promise: adapter.ajax(endpoint, 'GET', { data: { limit: 20 }}).then(payload => {
        if (this.isDestroying || this.isDestroyed) {
          return null;
        }

        let defaultLocale = store.peekAll('setting').findBy('key', 'account.default_language').get('value');
        if (insights.isTrialMode()) {
          defaultLocale = 'en-us';
        }

        let articles = payload.data
          .map(article => {
            let brand = brandFor({ article, payload, store });
            let locale = brand && brand.get('locale.locale') || defaultLocale;
            let titles = article.titles.map(title => payload.resources.locale_field[title.id]);
            let title = titles.filter(title => title.locale === locale)
              .map(title => title.translation)[0];
            let defaultTitle = (titles[0] && titles[0].translation) || '';
            let url = urlFor({ article, brand, locale, defaultLocale });

            return {
              id: article.id,
              title: title || defaultTitle,
              total_comments: article.total_comments,
              upvote_count: article.upvote_count,
              views: article.views,
              url
            };
          });

        this.set('articles', articles);

        return payload;
      })
    });
  })
});

function urlFor({ article, brand, locale, defaultLocale }) {
  let scheme = 'https://';
  let hostname = brand.get('subDomain') + '.' + brand.get('domain');
  let slug = article.slugs.findBy('locale', locale) ||
             article.slugs.findBy('locale', defaultLocale) ||
             article.slugs[0];
  let path = `/${slug.locale}/article/${slug.translation}`;
  let result = scheme + hostname + path;

  return result;
}

function brandFor({ article, payload, store }) {
  let section = payload.resources.section[article.section.id];
  let category = payload.resources.category[section.category.id];
  let result = store.peekRecord('brand', category.brand.id);

  return result;
}
