import IntlAdapter from 'ember-intl/adapters/-intl-adapter';
import Locale from 'frontend-cp/locales/new-locale';

export default IntlAdapter.extend({
  locales: {},

  findLanguage(locale) {
    if (locale instanceof Locale) {
      return locale;
    }

    if (typeof locale === 'string') {
      if (!this.locales[locale]) {
        this.locales[locale] = new (Locale.extend({
          locale: locale
        }))();
      }
      return this.locales[locale];
    }
  }
});
