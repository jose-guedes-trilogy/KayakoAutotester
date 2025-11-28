import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  store: service(),
  i18n: service(),
  notification: service(),
  virtualModel: service(),
  router: service(),
  locale: service(),
  article: null,
  init() {
    this._super(...arguments);
    this.set('article', {
      tags: [],
      attachments: [],
      allowComments: true,
      status: 'PUBLISHED',
      contents: [{ locale: this.get('locale.accountDefaultLocaleCode'), translation: '' }],
      titles: [{ locale: this.get('locale.accountDefaultLocaleCode'), translation: '' }],
    });
  },
  actions: {
    goToIndexRoute() {
      this.get('router').transitionTo('session.agent.knowledgebase.index');
    }
  }
});
