import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import config from 'frontend-cp/config/environment';
import EmberObject from '@ember/object';
import { get } from '@ember/object';
import { isEmpty } from '@ember/utils';
import _ from 'npm:lodash';
import { Promise } from 'rsvp';
import $ from 'jquery';
import { TOP, scrollTo } from 'frontend-cp/lib/scroll-to';
import adminStyles from 'frontend-cp/session/admin/styles';

export default Component.extend({
  i18n: service(),
  notification: service(),
  metricsService: service('metrics'),
  store: service(),
  confirmation: service(),

  defaultLocale: '',
  brands: [],
  messengerSettings: [],
  metrics: {},
  twitterAccounts: [],
  selectedTwitterAccount: {}, // Check
  selectedSectionId: null,
  brand: {},
  categoriesTree: [],
  activeTab: 'customize',
  primaryColor: '',
  activeSolidColor: '',
  activeGradient: '',
  activePattern: '',
  backgroundMode: '',
  replyTimeLocale: '',
  enableSuggestions: false,
  linkedBusinessHour: null,
  originalSettingsForSelectedBrand: '',
  unsavedChanges: {},
  tweets: [],

  // States
  isOnlinePresenceEnabled: true,
  isArticlesEnabled: false,
  isTwitterEnabled: false,

  titleLocaleFields: {},
  welcomeMessageLocaleFields: {},

  init() {
    this._super(...arguments);
    this.get('registerAs')(this);

    const settings = this.get('store').peekAll('setting');
    this.set('defaultLocale', settings.findBy('key', 'account.default_language').get('value'));

    const loadInitialState = () => {
      this.setInitialSelectedBrand();

      this.set('activeTab', this.get('hasMultipleBrands') ? 'brandSelection' : 'customize');
      
      this.loadMessengerSettingsForSelectedBrand();
      this.get('fetchTweets').perform();
      this.get('fetchCategories')
        .perform()
        .then(() => {
          this.loadArticleWidgetState();
        });
    };

    loadInitialState();
  },


  getMessengerSettingsForSelectedBrand() {
    return this.get('messengerSettings').findBy('brand.id', this.get('brand.id'));
  },
  
  loadMessengerSettingsForSelectedBrand() {
    const messengerSetting = this.getMessengerSettingsForSelectedBrand();
    if(messengerSetting) {
      this.loadState(this.convertSettingsToState(messengerSetting));
    } else {
      this.loadState(this.defaultState());
    }
    this.set('originalSettingsForSelectedBrand', this.getSerializedSettings());
  },

  getSerializedSettings() {
    // This is only to be used for comparing original vs edited fields.
    // So that we can show `discard changes` dialog
    // Here we chose to discard article settings from this comparison because its state
    // is calculated async(fetchCategories task). If a user switches between brands too fast he will be incorrectly prompted
    // of `discard changes` dialog
    const settings = this.convertStateToSettings();
    delete settings.metadata.widgets.articles;
    return JSON.stringify(settings);
  },

  isEdited () { // Returns whether or not any customizations have been made for current brand
    return this.get('originalSettingsForSelectedBrand') !== this.getSerializedSettings();
  },

  createLocaleFields() {
    const result = this.publicLocales().map(localeModel => {
      const locale = localeModel.get('locale');
      const localeField = EmberObject.create({ locale, translation: '' });
      return localeField;
    });
    return result;
  },

  defaultTitle() {
    return this.get('i18n').t('admin.messenger.tabs.customize.title_default_value');
  },

  defaultWelcomeMessage() {
    return this.get('i18n').t('admin.messenger.tabs.customize.welcome_default_value', {brand: this.get('brand.name')});
  },

  defaultState() {
    return {
      // Customize tab
      title: this.defaultTitle(),
      titleLocaleFields: this.createLocaleFields(),
      welcomeMessageLocaleFields: this.createLocaleFields(),
      welcomeMessage: this.defaultWelcomeMessage(),
      primaryColor: '#F1703F',

      activeSolidColor: '#FF3B30',
      activeGradient: '0deg, #889CFF 0%, #9BE1D3 100%',
      activePattern: '1',
      backgroundMode: 'gradient',
    
      // Widgets
      isOnlinePresenceEnabled: true,
      isArticlesEnabled: false,
      selectedSectionId: this.getPreSelectedSection(),
      isTwitterEnabled: false,
      selectedTwitterAccount: this.getPreSelectedTwitterAccount(),
    
      // Options
      replyTimeLocale: '',
      linkedBusinessHour: null,
      enableSuggestions: false
    };
  },

  loadState(state) {
    Object.keys(state).forEach(property => this.set(property, state[property]));
  },


  getArticleState(articles) {
    // takes in article widget settings
    // To be called when sections for current brand have been fetched
    const sectionExists = (sectionId) => {
      const categories = this.get('categoriesTree');
      return _.find(categories, (category) => {
        return !!(_.find(category.children, {id: sectionId}));
      });
    };

    const isArticlesEnabled = articles.enabled && sectionExists(articles.sectionId);
    return {
      isArticlesEnabled,
      selectedSectionId: isArticlesEnabled ? articles.sectionId : this.getPreSelectedSection(),
    };
  },

  getReplyTimeLocale(replyTimeExpectation) {
    if (!replyTimeExpectation) {
      return '';
    }
    const expectationToLocaleMap = {
      AUTO: '',
      ASAP: 'reply.asap',
      FEW_MINS: 'reply.in.few.minutes',
      FEW_HOURS: 'reply.in.few.hours'
    };
    return expectationToLocaleMap[replyTimeExpectation];
  },

  getReplyTimeExpectation(replyTimeLocale) {
    const localeToExpecationMap = {
      '': 'AUTO',
      'reply.asap': 'ASAP',
      'reply.in.few.minutes': 'FEW_MINS',
      'reply.in.few.hours': 'FEW_HOURS'
    };
    return localeToExpecationMap[replyTimeLocale];
  },

  extractLocaleTranslationFromSettings(settings, fieldName, locale) {
    const localeField = settings.get(fieldName).findBy('locale', locale);
    return localeField ? localeField.get('translation') : '';
  },

  convertSettingsToState(settings) {
    // This function recovers the component state from messenger settings
    const state = {};

    // wherever necessary we can fallback to default settings if needed
    const defaultState = this.defaultState();
  
    // home titles
    const titleLocaleFields = this.createLocaleFields();
    titleLocaleFields.forEach(localeField => {
      const locale = localeField.get('locale');
      const translation = this.extractLocaleTranslationFromSettings(settings, 'homeTitles', locale);

      if(locale !== this.get('defaultLocale')) {
        localeField.set('translation', translation);
        return;
      }

      if (translation) {
        state.title = translation;
        return;
      }

      state.title = this.defaultTitle();
    });
    state.titleLocaleFields = titleLocaleFields;

    // home subtitles
    const welcomeMessageLocaleFields = this.createLocaleFields();
    welcomeMessageLocaleFields.forEach(localeField => {
      const locale = localeField.get('locale');
      const translation = this.extractLocaleTranslationFromSettings(settings, 'homeSubtitles', locale);
      
      if(locale !== this.get('defaultLocale')) {
        localeField.set('translation', translation);
        return;
      }

      if (translation) {
        state.welcomeMessage = translation;
        return;
      }

      state.welcomeMessage = this.defaultWelcomeMessage();
    });
    state.welcomeMessageLocaleFields = welcomeMessageLocaleFields;

    const  metadata  = settings.get('metadata');
    const { widgets, styles } = metadata;
    
    // widgets
    state.isOnlinePresenceEnabled = widgets.presence.enabled;

    
    const { articles, twitter } = widgets;
    
    // Article sections need to be fetched async and validated
    // To quicken up the UI we load default settings here and then overwrite them later
    state.isArticlesEnabled = articles.enabled;
    state.selectedSectionId = defaultState.selectedSectionId;

    const getTwitterAccount = (handle) => {
      return this.get('twitterAccounts').findBy('id', handle);
    };

    state.isTwitterEnabled = (twitter.enabled && getTwitterAccount(twitter.twitterHandle)) ? true : false;
    state.selectedTwitterAccount = state.isTwitterEnabled ? getTwitterAccount(twitter.twitterHandle) : this.getPreSelectedTwitterAccount();

    // styles
    state.primaryColor = styles.primaryColor;

    const { homeBackground, homePattern }  = styles;

    state.activeGradient = defaultState.activeGradient;
    state.activeSolidColor = defaultState.activeSolidColor;

    const isSolidColor  = /^#[0-9A-F]{6}$/i.test(homeBackground);
    
    // apply settings
    if(isSolidColor) {
      state.activeSolidColor = homeBackground;
      state.backgroundMode = 'color';
    } else {
      state.activeGradient = homeBackground;
      state.backgroundMode = 'gradient';
    }
    
    if(homePattern === '') {
      state.activePattern = false;
    } else {
      state.activePattern = homePattern.replace(config.messengerAssetsUrl, '')[0];
    }

    state.replyTimeLocale = this.getReplyTimeLocale(settings.get('replyTimeExpectation'));
    state.linkedBusinessHour = settings.get('businesshour') || defaultState.linkedBusinessHour;
    state.enableSuggestions = settings.get('enableSuggestions');

    return state;
  },

  getBusinessHourId() {
    const businesshour = this.get('linkedBusinessHour');
    return businesshour ? Number(businesshour.get('id')) : null;
  },

  convertStateToSettings() {
    const settings = {
      reply_time_expectation: this.getReplyTimeExpectation(this.get('replyTimeLocale')),
      enable_suggestions: Boolean(this.get('enableSuggestions')),
      home_titles: this.getLocaleFieldValues('titleLocaleFields', 'title'),
      home_subtitles: this.getLocaleFieldValues('welcomeMessageLocaleFields', 'welcomeMessage'),
      businesshour_id: this.getBusinessHourId(),
      metadata: {
        widgets: {
          presence: {
            enabled: this.get('isOnlinePresenceEnabled')
          },
          twitter: {
            enabled: this.get('isTwitterEnabled'),
            twitterHandle: this.get('selectedTwitterAccount.id') || null
          },
          articles: {
            enabled: Boolean(this.get('isArticlesEnabled')),
            sectionId: this.get('selectedSectionId')
          }
        },
        styles: {
          primaryColor: this.get('primaryColor'),
          homeBackground: this.get('backgroundMode') === 'color' ? this.get('activeSolidColor') : this.get('activeGradient'),
          homePattern: this.get('patternUrl') ? this.get('patternUrl') : '',
          homeTextColor: this.get('isLightText') ? '#FFFFFF' : '#2D3138'
        }
      }
    };

    return settings;
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
  }),

  fetchTweets: task(function * () {
    const id = this.get('selectedTwitterAccount.id');
    if (!id) {
      return;
    }
    let tweets = yield this.get('store').query('twitter-tweet', {
      twitterIds: id
    });
    this.set('tweets', tweets);
  }).restartable(),

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

    return (mode === 'gradient' && darkGradient) || (mode === 'color' && darkSolidColor);
  }),

  publicLocales() {
    return this.get('store').peekAll('locale').filterBy('isPublic');
  },

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

  getLocaleFieldValues(fieldName, defaultLocaleFieldValue) {
    const fields = this.get(fieldName);
    if(!fields) return;
    const defaultLocale = this.get('defaultLocale');
    return fields.map((locale) => {
      const translation = locale.get('translation') ? locale.get('translation') : '';
      return {
        locale: locale.get('locale'),
        translation: defaultLocale === locale.get('locale') ? this.get(defaultLocaleFieldValue) : translation
      };
    });
  },

  generatedCode: computed(
    'brand.{domain,name,subDomain}',
    function() {
      let apiUrl = `https://${this.get('brand.subDomain')}.${this.get('brand.domain')}/api/v1`;
      // Escaping the quotes from brand name since they can mess up the embed code.
      return `<script>(function(d,a){function c(){var b=d.createElement("script");b.async=!0;b.type="text/javascript";b.src=a._settings.messengerUrl;b.crossOrigin="anonymous";var c=d.getElementsByTagName("script")[0];c.parentNode.insertBefore(b,c)}window.kayako=a;a.readyQueue=[];a.newEmbedCode=!0;a.ready=function(b){a.readyQueue.push(b)};a._settings={apiUrl:"${apiUrl}",messengerUrl:"https://${this.get('brand.subDomain')}.kayakocdn.com/messenger",realtimeUrl:"${config.kreSocket}"};window.attachEvent?window.attachEvent("onload",c):window.addEventListener("load",c,!1)})(document,window.kayako||{});</script>`;
  }),

  getTabNumberLocale: function(tabName) {
    // default tab positions
    const lookup = {
      brandSelection: 1, // Only visible for multiple brands. Should always be the first tab, other tabs must adjust if this one is visible.
      customize: 1,
      widgets: 2,
      options: 3,
      embed: 4
    };

    let number = lookup[tabName];
    if(typeof(number) !== 'number') {
      throw 'Tab not found';
    }
    
    if(tabName !== 'brandSelection' && this.get('hasMultipleBrands')) {
      number++;
    }

    return this.get('i18n').t(this.getNumberLocale(number));
  },

  getNumberLocale(number) { // Why are we using locales for numbers?
    const localePrefix = 'admin.messenger.tabNumbers';
    const lookup = [
      'one',
      'two',
      'three',
      'four',
      'five'
    ];
    return `${localePrefix}.${lookup[number - 1]}`;
  },

  // returns first section of first category in the dropdown
  getPreSelectedSection() {
    const firstSectionId = this.get('categoriesTree.firstObject.children.firstObject.id');
    return firstSectionId ? firstSectionId : '';
  },

  // Pre-selects first available twitter account
  getPreSelectedTwitterAccount() {
    if (this.get('twitterAccounts.length')) {
      return this.get('twitterAccounts.firstObject');
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

  loadArticleWidgetState() {
    const messengerSettings =  this.getMessengerSettingsForSelectedBrand();
    if(messengerSettings) {
      const { articles } = messengerSettings.get('metadata').widgets;
      this.loadState(this.getArticleState(articles));
    } else {
      this.loadState({ selectedSectionId: this.getPreSelectedSection()});
    }
  },

  reloadMessengerSettingsStore() {
    this.get('store').query('messenger-setting', {}).then((result) => {
      this.set('messengerSettings', result);
    });
  },

  saveSettings: task(function * () {
    let brandId = Number(this.get('brand.id'));
    const settings = this.convertStateToSettings();
    
    yield Promise.all([
      this.publishToHelpcenter(),
      this.get('store')
        .adapterFor('messenger-setting')
        .saveMessengerSettings(brandId, settings)
        .then(() => this.reloadMessengerSettingsStore()),
    ]);

    this.get('notification').add({
      type: 'success',
      title: `${this.get('i18n').t('admin.messenger.tabs.options.save_success')}`,
      autodismiss: true
    });

    this.set('activeTab', 'embed');
    this.scrollToTopOfTab();
    this.set('originalSettingsForSelectedBrand', this.getSerializedSettings());
  }),

  publishToHelpcenter() {
    const brandId = this.get('brand.id');
    let name = 'helpcenter_kayako_messenger';
    let contents = this.get('generatedCode');

    return this.get('store')
      .adapterFor('template')
      .updateTempalte(brandId, name, contents);
  },

  scrollToTopOfTab() {
    scrollTo({position: TOP, parent: $(`.${adminStyles['content-container']}`), animated: true });
  },

  switchBrand(brand) {
    this.set('brand', brand);
    this.loadMessengerSettingsForSelectedBrand();
    this.get('fetchCategories').perform()
      .then(() => {
        this.loadArticleWidgetState();
      });
  },

  actions: {
    switchTab(activeTab) {
      this.set('activeTab', activeTab);
      this.scrollToTopOfTab();      
    },

    brandChanged(brand) {
      if (!this.isEdited()) {
        this.switchBrand(brand);
        return;
      }
      this.get('confirmation').confirm({
        intlConfirmationHeader: 'generic.confirm.lose_changes_header',
        intlConfirmationBody: 'admin.messenger.confirm_lose_changes',
        intlConfirmLabel: 'generic.confirm.lose_changes_button'
      }).then(() => {
        this.switchBrand(brand);
      });
    },

    setSection(sectionNode) {
      this.set('selectedSectionId', get(sectionNode, 'id'));
    },

    twitterAccountChanged(account) {
      this.set('selectedTwitterAccount', account);
      this.get('fetchTweets').perform();
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
