import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import config from 'frontend-cp/config/environment';
import EmberObject from '@ember/object';
import { get } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Component.extend({
  i18n: service(),
  notification: service(),
  metricsService: service('metrics'),
  store: service(),

  defaultLocale: '',
  brands: [],
  metrics: {},
  twitterAccounts: [],
  selectedTwitterAccount: {},
  selectedSectionId: null,
  brand: {},
  categoriesTree: [],
  activeTab: 'customize',
  primaryColor: '#F1703F',
  activeSolidColor: '#FF3B30',
  activeGradient: '-192deg, #40364D 37%, #9B4779 100%',
  activePattern: '1',
  backgroundMode: 'gradient',
  replyTimeLocale: '',

  // States
  isOnlinePresenceEnabled: true,
  isArticlesEnabled: false,
  isTwitterEnabled: false,

  init() {
    this._super(...arguments);
    this.setInitialSelectedBrand();
    this.get('fetchCategories').perform();
    const settings = this.get('store').peekAll('setting');
    this.set('defaultLocale', settings.findBy('key', 'account.default_language').get('value'));
  },

  didReceiveAttrs() {
    this.preSelectTwitterAccount();
  },

  // CPs
  hasMultipleBrands: computed.gt('brands.length', 1),

  isTwitterConnected: computed.readOnly('twitterAccounts.length'),

  fetchCategories: task(function * () {
    let limit = 999;
    let store = this.get('store');
    let brandId = this.get('brand.id');
    let categories = yield store.query('category', { brandId, limit });

    if (isEmpty(categories)) {
      this.set('categoriesTree', []);
      this.preSelectSection();
      return;
    }

    let categoryIds = categories.mapBy('id').join(',');
    let sections = yield store.query('section', { categoryIds, limit });
    let tree = [];

    sections.forEach(section => {
      let category = section.get('category');
      let sectionNode = {
        id: section.get('id'),
        value: section.get('title')
      };
      let categoryNode = tree.findBy('value', category.get('title'));

      if (!categoryNode) {
        categoryNode = {
          value: category.get('title'),
          children: []
        };

        tree.push(categoryNode);
      }

      categoryNode.children.push(sectionNode);
    });

    this.set('categoriesTree', tree);
    this.preSelectSection();
  }),

  tweets: computed('selectedTwitterAccount', function () {
    let twitterId = this.get('selectedTwitterAccount.id');
    if (twitterId) {
      this.get('fetchTweets').perform(twitterId);
    }
    return [];
  }),

  fetchTweets: task(function * (id) {
    let tweets = yield this.get('store').query('twitter-tweet', {
      twitterIds: id
    });
    this.set('tweets', tweets);
  }),

  hasNoSections: computed.not('categoriesTree.length'),

  articles: computed('selectedSectionId', function() {
    let store = this.get('store');
    let section_id = this.get('selectedSectionId');
    let limit = 3;

    if (section_id) {
      return store.query('article', { section_id, limit });
    } else {
      return [];
    }
  }),

  isDarkSolidColor: computed('activeSolidColor', function() {
    let solidColor = this.get('activeSolidColor');
    if (this.getColorDarkness(solidColor) < 172) {
      return true;
    }
  }),

  isDarkGradient: computed('activeGradient', function() {
    let gradientValue = this.get('activeGradient');
    if (gradientValue) {
      let colors = gradientValue.match(/#\w{6}/g);
      let lightness1 = this.getColorDarkness(colors[0]);
      let lightness2 = this.getColorDarkness(colors[1]);

      if ((lightness1 < 135) && (lightness2 < 190)) {
        return true;
      }
    }
  }),

  isLightText: computed('isDarkSolidColor', 'isDarkGradient', 'backgroundMode', function() {
    let mode = this.get('backgroundMode');
    let darkGradient = this.get('isDarkGradient');
    let darkSolidColor = this.get('isDarkSolidColor');

    if ((mode === 'gradient' && darkGradient) || (mode === 'color' && darkSolidColor)) {
      return true;
    }
  }),

  title: computed(function() {
    return this.get('i18n').t('admin.messenger.tabs.customize.title_default_value');
  }),

  welcomeMessage: computed(function() {
    return this.get('i18n').t('admin.messenger.tabs.customize.welcome_default_value', {brand: this.get('brand.name')});
  }),

  publicLocales: computed(function() {
    return this.get('store').peekAll('locale').filterBy('isPublic');
  }),

  titleLocaleFields: computed('publicLocales', function() {
    let result = this.get('publicLocales').map(localeModel => {
      let locale = localeModel.get('locale');
      let localeField = EmberObject.create({ locale, translation: '' });
      return localeField;
    });
    return result;
  }),

  welcomeMessageLocaleFields: computed('publicLocales', function() {
    let result = this.get('publicLocales').map(localeModel => {
      let locale = localeModel.get('locale');
      let localeField = EmberObject.create({ locale, translation: '' });
      return localeField;
    });
    return result;
  }),

  patternUrl: computed('activePattern', 'activeSolidColor', 'activeGradient', 'backgroundMode', function() {
    let mode = this.get('backgroundMode');
    let suffix = '';
    let url = '';

    if (this.get('activePattern')) {
      if (mode === 'gradient' && this.get('isDarkGradient')) {
        suffix = '--dark';
      } else if (mode === 'color') {
        if (this.getColorDarkness(this.get('activeSolidColor')) > 190) {
          suffix = '--dark';
        }
      }
      url = `${config.messengerAssetsUrl}${this.get('activePattern')}${suffix}.svg`;
    }

    return url;
  }),

  generatedCode: computed(
    'activeGradient',
    'activeSolidColor',
    'backgroundMode',
    'brand.{domain,name,subDomain}',
    'isArticlesEnabled',
    'isLightText',
    'isOnlinePresenceEnabled',
    'isTwitterEnabled',
    'patternUrl',
    'primaryColor',
    'selectedSectionId',
    'selectedTwitterAccount.id',
    'title',
    'titleLocaleFields.@each.translation',
    'welcomeMessage',
    'welcomeMessageLocaleFields.@each.translation',
    'replyTimeLocale',
  function() {
    let apiUrl = `https://${this.get('brand.subDomain')}.${this.get('brand.domain')}/api/v1`;
    // Escaping the quotes from brand name since they can mess up the embed code.
    let brandName = this.get('brand.name').replace(/"/g, '\\"');
    let primaryColor = this.get('primaryColor');
    let textColor = this.get('isLightText') ? '#FFFFFF' : '#2D3138';
    let presenceEnabled = this.get('isOnlinePresenceEnabled');
    let articlesEnabled = this.get('isArticlesEnabled');
    let twitterEnabled = this.get('isTwitterEnabled');
    let twitterAccountId = this.get('selectedTwitterAccount.id') || null;
    let sectionId = this.get('selectedSectionId');
    let pattern = this.get('patternUrl');
    let replyTimeLocale = this.get('replyTimeLocale');
    let background = this.get('backgroundMode') === 'color' ? this.get('activeSolidColor') : this.get('activeGradient');
    const defaultLocale = this.get('defaultLocale');
    let homeTitles = this.get('titleLocaleFields').map((locale) => {
      return {
        locale: locale.get('locale'),
        translation: defaultLocale === locale.get('locale') ? this.get('title') : locale.get('translation')
      };
    });
    let homeWelcomeMessages = this.get('welcomeMessageLocaleFields').map((locale) => {
      return {
        locale: locale.get('locale'),
        translation: defaultLocale === locale.get('locale') ? this.get('welcomeMessage') : locale.get('translation')
      };
    });

    return `<script>(function(d,a){function c(){var b=d.createElement("script");b.async=!0;b.type="text/javascript";b.src=a._settings.messengerUrl;b.crossOrigin="anonymous";var c=d.getElementsByTagName("script")[0];c.parentNode.insertBefore(b,c)}window.kayako=a;a.readyQueue=[];a.newEmbedCode=!0;a.ready=function(b){a.readyQueue.push(b)};a._settings={apiUrl:"${apiUrl}",teamName:"${brandName}",homeTitles:${JSON.stringify(homeTitles)},homeSubtitles:${JSON.stringify(homeWelcomeMessages)},replyTimeLocale:"${replyTimeLocale}",messengerUrl:"https://${this.get('brand.subDomain')}.kayakocdn.com/messenger",realtimeUrl:"${config.kreSocket}",widgets:{presence:{enabled:${presenceEnabled}},twitter:{enabled:${twitterEnabled},twitterHandle:"${twitterAccountId}"},articles:{enabled:${articlesEnabled},sectionId:${sectionId}}},styles:{primaryColor:"${primaryColor}",homeBackground:"${background}",homePattern:"${pattern}",homeTextColor:"${textColor}"}};window.attachEvent?window.attachEvent("onload",c):window.addEventListener("load",c,!1)})(document,window.kayako||{});</script>`;
  }),

  // Pre-selects first section of first category in the dropdown
  preSelectSection() {
    const firstSectionId = this.get('categoriesTree.firstObject.children.firstObject.id');
    this.set('selectedSectionId', firstSectionId);
  },

  // Pre-selects first available twitter account
  preSelectTwitterAccount() {
    if (this.get('twitterAccounts.length')) {
      this.set('selectedTwitterAccount', this.get('twitterAccounts.firstObject'));
    }
  },

  getColorDarkness(hexCode) {
    let hex = hexCode.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    return Math.round(((parseInt(r) * 299) + (parseInt(g) * 587) + (parseInt(b) * 114)) / 1000);
  },

  setInitialSelectedBrand() {
    this.set('brand', this.get('brands').findBy('isDefault', true));
  },

  publish: task(function * () {
    let brandId = this.get('brand.id');
    let name = 'helpcenter_kayako_messenger';
    let contents = this.get('generatedCode');

    yield this.get('store')
      .adapterFor('template')
      .updateTempalte(brandId, name, contents);

    this.get('notification').add({
      type: 'success',
      title: `${this.get('brand.name')} ${this.get('i18n').t('admin.messenger.tabs.embed.publish_success')}`,
      autodismiss: true
    });
  }),

  actions: {
    switchTab(activeTab) {
      this.set('activeTab', activeTab);
    },

    brandChanged(brand) {
      this.set('brand', brand);
      this.get('fetchCategories').perform();
    },

    setSection(sectionNode) {
      this.set('selectedSectionId', get(sectionNode, 'id'));
    },

    twitterAccountChanged(account) {
      this.set('selectedTwitterAccount', account);
    },

    copiedToClipboard() {
      this.get('metricsService').trackEvent({
        event: 'Messenger - Copy to clipboard',
        category: 'Admin'
      });

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.copied_to_clipboard'),
        autodismiss: true
      });
    }
  }
});
