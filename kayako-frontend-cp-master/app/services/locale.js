import { getOwner } from '@ember/application';
import { computed } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'frontend-cp/config/environment';
import moment from 'moment';
import EN_US_STRINGS from 'frontend-cp/locales/en-us';
import RSVP from 'rsvp';
import { variation } from 'ember-launch-darkly';

const USER_LOCALE_KEY = 'user-locale-v2';
const FALLBACK_ACCOUNT_DEFAULT_LOCALE_CODE = ENV.defaultLocale;

export default Service.extend({
  store: service(),
  intl: service(),
  session: service(),
  localStore: service(),
  moment: service(),

  // CPs
  userLocale: computed('session.user', function () {
    return this.get('session.user.locale');
  }),

  settings: computed(function() {
    let store = this.get('store');
    return store.peekAll('setting');
  }),

  accountDefaultLanguageSetting: computed('settings.[]', function() {
    let settings = this.get('settings');
    let setting = settings.findBy('key', 'account.default_language');

    return setting;
  }),

  accountDefaultLocaleCode: computed('accountDefaultLanguageSetting.value', function() {
    return this.get('accountDefaultLanguageSetting.value') || FALLBACK_ACCOUNT_DEFAULT_LOCALE_CODE;
  }),

  // Methods
  setup() {
    const store = this.get('store');
    this.get('intl').set('adapterType', 'intl');

    return store.findAll('locale').then((locales) => {
      let currentLocale = this.getCurrentLocale(locales);
      this.persistLocaleToLocalStorage(currentLocale);
      return this._populateTranslations(currentLocale);
    });
  },

  _requestLocaleStrings(locale) {
    const adapter = getOwner(this).lookup('adapter:application');
    return adapter.ajax(`${adapter.namespace}/locales/${locale}/strings`, 'GET');
  },

  _populateTranslations(locale) {
    const intl = this.get('intl');

    let localeCode = locale.get('locale');

    intl.addTranslations(localeCode, {});
    intl.setLocale(localeCode);

    // this only sets the locale for the moment service
    // not for when we import moment from 'moment':
    // this.get('moment').changeLocale(localeCode);
    // set on imported version which applies globally:
    moment.locale(localeCode);

    // This check corresponds to the getCurrentLocale method where en-gb is bypassed
    // Will be using this until it is localized
    if (['en-gb', FALLBACK_ACCOUNT_DEFAULT_LOCALE_CODE].includes(localeCode)) {
      intl.addTranslations(localeCode, EN_US_STRINGS);
      return RSVP.resolve();
    } else {
      let promise;

      if (variation('ops-use-locale-code-instead-of-id')) {
        promise = this._requestLocaleStrings(localeCode);
      } else {
        promise = this._requestLocaleStrings(locale.id);
      }

      return promise.then((strings) => {
        // Converts a collection of translations like `"a.b.c": "hello"` to `{ a: { b: { c: "Hello" } } }`
        // as it is the format expected by ember-intl since 2.0.0
        let translations = strings.data.reduce(function(accum, translation) {
          if (translation.id.slice(0, 13) === 'frontend.api.') {
            let parts = translation.id.slice(13).split('.');
            let key = parts[parts.length - 1];
            let lastObject = accum[parts[0]] = accum[parts[0]] || {};
            try {
              parts.slice(1, -1).forEach(function(part) {
                if (!lastObject[part]) {
                  lastObject[part] = {};
                }
                lastObject = lastObject[part];
              });
              lastObject[key] = translation.value;
            } catch (e) {
              window.console.warn('Error converting translations: ' + e.message);
            }
          }
          return accum;
        }, {});

        intl.addTranslations(localeCode, translations);
      });
    }
  },

  getCurrentLocale(locales) {
    let code = this.get('userLocale.locale') || this.getLocaleCodeFromLocalStorage();
    let locale = locales.findBy('locale', code);

    // Bypassing this makes sure moment gets correct locale
    if (locale && (locale.get('isLocalized') || (code.toLowerCase() === 'en-gb'))) {
      return locale;
    } else {
      return locales.findBy('locale', ENV.defaultLocale) || locales.findBy('isPublic');
    }
  },

  getLocaleLanguage(localeCode) {
    const locales = this.get('store').peekAll('locale').filterBy('isPublic');
    for (const locale of locales) {
      if (locale.get('locale') === localeCode) {
        return locale.get('name');
      }
    }
    return '';
  },

  getLocaleCodeFromLocalStorage() {
    return this.get('localStore')
      .getItem('locale', USER_LOCALE_KEY, {persist: true});
  },

  persistLocaleToLocalStorage(locale) {
    let localStore = this.get('localStore');
    let code = locale.get('locale');

    localStore.setItem('locale', USER_LOCALE_KEY, code, { persist: true });
  }
});
