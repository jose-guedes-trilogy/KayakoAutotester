import { A } from '@ember/array';
import Component from '@ember/component';
import { getOwner } from '@ember/application';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';
import config from 'frontend-cp/config/environment';
import EmberObject from '@ember/object';

export default Component.extend({
  session: service(),
  store: service(),
  metrics: service(),
  notification: service(),
  i18n: service(),
  routing: service('-routing'),
  onBoardingStatus: service(),
  agentCache: service('cache/agent-cache'),

  // PROPS
  brand: {},
  invitation: {},
  teams: [],
  roles: [],
  twitterAccount: [],
  facebookPage: [],
  params: {},
  primaryColor: '#F1703F',
  activeSolidColor: '#FF3B30',
  activeGradient: '-192deg, #40364D 37%, #9B4779 100%',
  activePattern: '1',
  backgroundMode: 'gradient',
  agentMetrics: {},

  // STATES
  activePopup: 0,
  hideEmailSetupTitle: false,
  hideMessengerSetupTitle: false,
  hideAgentSetupTitle: false,
  emailPopupRevisited: false,
  isFinished: false,
  hasRevisited: false,
  emailStep: 'initial',
  socialSetup: 'initial',
  messengerSetup: 'initial',
  agentSetup: 'initial',
  agentsRows: 0,
  emailToBeCreated: null,
  internalDisplayEmail: '',
  nextStep: null,
  pages: null,
  availablePages: null,
  fetchingPages: false,
  importingPages: false,
  twitterButtonDisabled: false,
  isTwitterloading: false,
  twitterConnected: false,
  facebookButtonDisabled: false,
  importPagesButtonDisabled: true,
  isFacebookConnecting: false,
  facebookPagesConnected: false,
  grayoutSocial: false,
  grayoutAgents: false,

  init() {
    this._super(...arguments);

    // Don't show cofetti animation if user has revisited after completing
    // all steps
    if (this.get('onBoardingStatus.pendingSteps') === 0) {
      this.set('hasRevisited', true);
    }

    if (this.get('onBoardingStatus.progress.account_setup')) {
      this.set('emailPopupRevisited', true);
    }

    this.setActiveStep();
    this.getNextStep();

    // Show twitter/facebook modals if URL has the required params
    const params = this.get('params');
    if (params.code && params.state) {
      this.connectFacebook(params);
    }
    if (params.oauth_token && params.oauth_verifier) {
      this.connectTwitter(params);
    }

    let pages = this.get('pages');
    if (!pages) {
      this.set('pages', A());
    }

    // Disable facebook/twitter buttons if already connected
    if (this.get('twitterAccount.length')) {
      this.set('twitterConnected', true);
      this.set('twitterButtonDisabled', true);
      this.set('socialSetup', 'connect');
    }
    if (this.get('facebookPage.length')) {
      this.set('facebookPagesConnected', true);
      this.set('facebookButtonDisabled', true);
      this.set('socialSetup', 'connect');
    }

    // Check if agents have been invited already
    this.get('agentCache').getAgents().then(agents => {
      if ((agents.get('length') < 2) && this.get('onBoardingStatus.progress.agent_added')) {
        this.set('grayoutAgents', true);
        this.set('agentSetup', 'initial');
        this.set('hideAgentSetupTitle', false);
      }
    });
  },

  willDestroyElement() {
    this._super(...arguments);
    this._unloadUnsavedMailboxes();
  },

  progressDidChange: observer('onBoardingStatus.progress', function() {
    this.setActiveStep();
    this.getNextStep();
  }),

  connectTwitter(params) {
    this.set('activePopup', 2);
    this.set('socialSetup', 'connect');
    this.set('isTwitterloading', true);
    this.get('store').createRecord('twitter-account-callback', {
      oauthToken: params.oauth_token,
      oauthVerifier: params.oauth_verifier
    }).save().then(() => {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('welcome.popups.social.connect.twitterconnected'),
        autodismiss: true
      });
      this.set('twitterConnected', true);
      this.set('twitterButtonDisabled', true);
    }).finally(() => {
      this.get('routing.router').replaceWith('/agent/welcome');
      this.set('isTwitterloading', false);
    });
  },

  connectFacebook(params) {
    this.set('activePopup', 2);
    this.set('socialSetup', 'connectpages');
    this.set('importPagesButtonDisabled', true);
    this.set('fetchingPages', true);
    this.get('store').queryRecord('facebook-account-callback', {
      code: params.code,
      state: params.state,
      callback: '/agent/welcome#facebook'
    }).finally(() => {
      this.get('routing.router').replaceWith('/agent/welcome');
      this.get('fetchAvailablePages').perform();
    });
  },

  // COMPUTED PROPERTIES
  isDarkSolidColor: computed('activeSolidColor', function() {
    let solidColor = this.get('activeSolidColor');
    if (this.getColorDarkness(solidColor) < 172) {
      return true;
    }
    return false;
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
      return false;
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
    return this.get('i18n').t('admin.messenger.tabs.customize.welcome_default_value', {brand: this.get('brand.firstObject.name')});
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

  preview: computed('title', 'welcomeMessage', 'patternUrl', 'activeGradient', 'activeSolidColor', 'backgroundMode', 'primaryColor', 'isOnlinePresenceEnabled', 'isArticlesEnabled', 'isTwitterEnabled', 'selectedSection', 'selectedTwitterAccount', function() {
    return EmberObject.create({
      title: this.get('title'),
      welcomeMessage: this.get('welcomeMessage'),
      patternUrl: this.get('patternUrl'),
      activeGradient: this.get('activeGradient'),
      activeSolidColor: this.get('activeSolidColor'),
      backgroundMode: this.get('backgroundMode'),
      isLightText: this.get('isLightText'),
      primaryColor: this.get('primaryColor'),
      lastActiveAgents: this.get('agentMetrics.lastActiveAgents'),
      isOnlinePresenceEnabled: true,
      isArticlesEnabled: false,
      isTwitterEnabled: false
    });
  }),

  generatedCode: computed('preview', 'titleLocaleFields.@each.translation', 'welcomeMessageLocaleFields.@each.translation', function() {
    let apiUrl = `https://${this.get('brand.firstObject.subDomain')}.${this.get('brand.firstObject.domain')}/api/v1`;
    // Escaping the quotes from brand name since they can mess up the embed code.
    let brandName = this.get('brand.firstObject.name').replace(/"/g, '\\"');
    let primaryColor = this.get('primaryColor');
    let textColor = this.get('isLightText') ? '#FFFFFF' : '#2D3138';
    let presenceEnabled = true;
    let articlesEnabled = false;
    let twitterEnabled = false;
    let twitterAccountId = null;
    let sectionId = null;
    let pattern = this.get('patternUrl');
    let background = this.get('backgroundMode') === 'color' ? this.get('activeSolidColor') : this.get('activeGradient');
    let homeTitles = this.get('titleLocaleFields').map((locale, index) => {
      return {
        locale: locale.get('locale'),
        translation: index === 0 ? this.get('title') : locale.get('translation')
      };
    });
    let homeWelcomeMessages = this.get('welcomeMessageLocaleFields').map((locale, index) => {
      return {
        locale: locale.get('locale'),
        translation: index === 0 ? this.get('welcomeMessage') : locale.get('translation')
      };
    });

    return `<script type="text/javascript">!function(a,b){function c(){var b=a.createElement("iframe");return b.id="kayako-messenger-frame",b.style.border="none",b.style.width="100%",b.style.height="100%",b}function d(){var c=a.createElement("script");return c.async=!0,c.type="text/javascript",c.src=b._settings.messengerUrl,c.crossOrigin="anonymous",c}function e(){var b=a.createElement("div");return b.id="kayako-messenger",b.style.position="fixed",b.style.right=0,b.style.bottom=0,b.style.width=0,b.style.height=0,b}window.kayako=b,b.readyQueue=[],b.ready=function(a){b.readyQueue.push(a)},b._settings={apiUrl:"${apiUrl}",teamName:"${brandName}",homeTitles:${JSON.stringify(homeTitles)},homeSubtitles:${JSON.stringify(homeWelcomeMessages)},messengerUrl:"https://${this.get('brand.firstObject.subDomain')}.kayakocdn.com/messenger",realtimeUrl:"${config.kreSocket}",widgets:{presence:{enabled:${presenceEnabled}},twitter:{enabled:${twitterEnabled},twitterHandle:"${twitterAccountId}"},articles:{enabled:${articlesEnabled},sectionId:${sectionId}}},styles:{primaryColor:"${primaryColor}",homeBackground:"${background}",homePattern:"${pattern}",homeTextColor:"${textColor}"}};var f=a.body.getElementsByTagName("script")[0],g=c(),h=e();f.parentNode.insertBefore(h,f),h.appendChild(g,f),g.contentWindow.document.open(),g.contentWindow.document.write("<!DOCTYPE html>"),g.contentWindow.document.write("<html>"),g.contentWindow.document.write("<head></head>"),g.contentWindow.document.write("<body></body>"),g.contentWindow.document.write("</html>"),g.contentWindow.document.body.appendChild(d()),g.contentWindow.document.close()}(document,window.kayako||{});</script>`;
  }),

  fullDomain: computed(function() {
    return `@${this.get('brand.firstObject.subDomain')}.${this.get('brand.firstObject.domain')}`;
  }),

  hideSocialPopupFooter: computed('socialSetup', function() {
    switch (this.get('socialSetup')) {
      case 'connect':
        return false;
      case 'connectpages':
        return false;
      default:
        return true;
    }
  }),

  isFacebookPagesPopup: computed('socialSetup', function() {
    return this.get('socialSetup') === 'connectpages';
  }),

  getColorDarkness(hexCode) {
    let hex = hexCode.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    return Math.round(((parseInt(r) * 299) + (parseInt(g) * 587) + (parseInt(b) * 114)) / 1000);
  },

  setActiveStep() {
    if (this.get('onBoardingStatus.progress.account_setup')) {
      this.set('emailStep', 'created');
      this.set('hideEmailSetupTitle', true);
    }
    if (this.get('onBoardingStatus.progress.account_connected')) {
      if (this.get('twitterButtonDisabled') && this.get('facebookButtonDisabled')) {
        this.set('socialSetup', 'done');
        this.set('hideSocialSetupTitle', true);
      } else {
        this.set('grayoutSocial', true);
      }
    }
    if (this.get('onBoardingStatus.progress.setup')) {
      this.set('messengerSetup', 'embedCode');
    }
    if (this.get('onBoardingStatus.progress.agent_added')) {
      this.set('agentSetup', 'done');
      this.set('hideAgentSetupTitle', true);
    }
  },

  getNextStep () {
    if (!this.get('onBoardingStatus.progress.account_setup')) {
      this.set('nextStep', 'email');
    } else if (!this.get('onBoardingStatus.progress.account_connected')) {
      this.set('nextStep', 'social');
    } else if (!this.get('onBoardingStatus.progress.setup')) {
      this.set('nextStep', 'messenger');
    } else if (!this.get('onBoardingStatus.progress.agent_added')) {
      this.set('nextStep', 'agents');
    } else {
      this.set('nextStep', null);
    }
  },

  emailToBeConnected: computed(function() {
    return this.get('store').createRecord('mailbox', {
      address: ''
    });
  }),

  agentModalDimensions: computed('agentSetup', 'agentsRows', function() {
    switch (this.get('agentSetup')) {
      case 'add':
        if (this.get('agentsRows')) {
          let modalHeight = 300 + (this.get('agentsRows') - 1) * 38;
          return `width: 900px; height: ${modalHeight}px`;
        }
        return 'width:900px;height:300px';
      case 'done':
        return 'width:420px;height:440px';
      default:
        return 'width:600px;height:400px';
    }
  }),

  socialModalDimensions: computed('socialSetup', function() {
    switch (this.get('socialSetup')) {
      case 'connect':
        return 'width:900px;height:570px';
      case 'connectpages':
        return 'width:420px;height:400px;';
      case 'done':
        return 'width:420px;height:450px';
      default:
        return 'width:600px;height:400px';
    }
  }),

  referenceData: computed('roles', 'teams', function() {
    return {
      roles: this.get('roles'),
      teams: this.get('teams')
    };
  }),

  redirectToTwitterAuthenticationEndpoint: task(function * (e) {
    e.stopPropagation();
    this.set('isTwitterloading', true);
    const link = yield this.get('store').queryRecord('oauth-link', { callback: '/agent/welcome#twitter' });
    window.location.href = link.get('id');
  }).drop(),

  saveTask: task(function * (invitation) {
    let adapter = getOwner(this).lookup('adapter:application');
    let data = {
      users: invitation.get('users').map(user => {
        let obj = user.getProperties('fullname', 'email');
        obj.role_id = user.get('role.id') || null;
        obj.team_ids = user.get('teams').mapBy('id');
        return obj;
      })
    };

    invitation.get('users').forEach(user => user.set('errors', null));

    try {
      yield adapter.ajax(`${adapter.namespace}/users/invite`, 'POST', { data });

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('admin.staff.members_invited.notification'),
        autodismiss: true
      });

      let emails = data.users.map(user => user.email);
      this.set('invitation.emails', emails);
      this.set('agentSetup', 'done');
      this.set('hideAgentSetupTitle', true);

      this.get('onBoardingStatus').updateStatus('agent_added', {'user.agent_added': '1'});
    } catch (error) {
      const errors = error.errors;
      let regex = /users\/(\d+)\/(\w+)/;
      errors.forEach(error => {
        let { pointer } = error;
        if (!pointer) { return; }
        let results = pointer.match(regex);
        let index = results[1];
        let field = results[2];
        let message = error.message;
        switch (field) {
          case 'role_id':
            field = 'role';
            break;
          case 'team_ids':
            field = 'teams';
            break;
        }
        let user = invitation.get('users').objectAt(index);
        if (!user.get('errors')) {
          user.set('errors', {});
        }

        if (!user.get('errors.' + field)) {
          user.set('errors.' + field, A([]));
        }

        user.get('errors.' + field).pushObject({ message });
      });
    }
  }).drop(),

  fetchAvailablePages: task(function * () {
    yield this.get('store').query('facebook-page', { state: 'AVAILABLE' }).then((pages) => {
      this.set('socialSetup', 'connectpages');
      this.set('fetchingPages', false);
      this.set('availablePages', pages);
      if (pages.get('length')) {
        this.set('importPagesButtonDisabled', false);
      }
    });
  }).drop(),

  _unloadUnsavedMailboxes() {
    let store = this.get('store');
    let mailboxes = store.peekAll('mailbox');
    let newMailboxes = mailboxes.filterBy('isNew');

    newMailboxes.forEach(mailbox => store.unloadRecord(mailbox));
  },

  publish: task(function * () {
    let brandId = this.get('brand.firstObject.id');
    let name = 'helpcenter_kayako_messenger';
    let contents = this.get('generatedCode');

    yield this.get('store')
      .adapterFor('template')
      .updateTempalte(brandId, name, contents)
      .finally(() => {
        this.set('messengerSetup', 'embedCode');
      });
  }),

  actions: {
    showPopup(index) {
      this.set('noModalTitle', false);
      this.set('activePopup', index);
    },

    cancel() {
      this.set('activePopup', 0);
      if (this.get('onBoardingStatus.pendingSteps') === 0 && !this.get('hasRevisited')) {
        this.set('isFinished', true);
      }
    },

    startEmail() {
      this.set('emailStep', 'initial');
    },

    connectEmailInput() {
      this.set('emailStep', 'connect');
    },

    connectEmail(e) {
      e.preventDefault();

      let mailbox = this.get('emailToBeConnected');
      let adapter = this.get('store').adapterFor('mailbox');

      mailbox.save()
        .then(() => adapter.makeDefault(mailbox))
        .then(() => this.set('emailStep', 'emailForwarding'));
    },

    emailConnected() {
      this.set('emailStep', 'connected');
      this.send('emailDone');
    },

    emailDone() {
      this.set('hideEmailSetupTitle', true);
      this.get('onBoardingStatus').updateStatus('account_setup', {'email.account_setup': '1'});
    },

    createEmailInput() {
      this.set('emailStep', 'create');
    },

    createEmail(e) {
      e.preventDefault();
      /**
        Since we are doing string concatanation, we need to make sure email
        name does exists before doing so.
      */
      const address = this.get('createEmailName') ? `${this.get('createEmailName')}${this.get('fullDomain')}` : null;

      const emailModel = this.get('store').createRecord('mailbox', {
        address: address
      });

      this.set('emailToBeCreated', emailModel);

      if (this.get('createEmailName') === 'support') {
        this.set('emailStep', 'created');
        this.send('emailDone');
        return;
      }

      let mailbox = this.get('emailToBeCreated');
      let adapter = this.get('store').adapterFor('mailbox');

      mailbox.save()
      .then(() => adapter.makeDefault(mailbox))
      .then(() => {
        this.set('emailStep', 'created');
        this.send('emailDone');
      });
    },

    connectSocial() {
      this.set('socialSetup', 'connect');
    },

    skipSocialSetup() {
      this.set('activePopup', 3);
      this.set('grayoutSocial', true);
      this.get('onBoardingStatus').updateStatus('account_connected', {'social.account_connected': '1'});
    },

    redirectToFacebookAuthenticationEndpoint(e) {
      e.stopPropagation();
      this.set('isFacebookConnecting', true);
      let store = this.get('store');

      store.queryRecord('oauth-link', { callback: '/agent/welcome#facebook' }).then(link => {
        window.location.href = link.get('id');
      });
    },

    importPages() {
      const adapter = getOwner(this).lookup('adapter:application');
      const url = `${adapter.namespace}/facebook/pages`;

      this.set('importingPages', true);

      adapter.ajax(url, 'POST', {
        data: {
          page_ids: this.get('availablePages').filterBy('import', true).map(page => page.get('id')).join(',')
        }
      }).then((pagesPayload) => {
        this.get('store').pushPayload(pagesPayload);

        let pages = pagesPayload.facebook_pages.map((page) => {
          return this.get('store').peekRecord('facebook-page', page.id)._internalModel;
        });

        this.get('pages').addObjects(pages);
        this.set('importingPages', false);
        this.set('socialSetup', 'connect');
        this.set('facebookButtonDisabled', true);
        this.set('facebookPagesConnected', true);
        this.get('notification').add({
          type: 'success',
          title: this.get('i18n').t('welcome.popups.social.connect.facebookpagessuccess'),
          autodismiss: true
        });

      }, () => {
        this.set('importingPages', false);
      });
    },

    socialSetupDone() {
      this.set('socialSetup', 'done');
      this.get('onBoardingStatus').updateStatus('account_connected', {'social.account_connected': '1'});
    },

    copiedToClipboard() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.copied_to_clipboard'),
        autodismiss: true
      });
    },

    messengerSet() {
      this.set('activePopup', 4);
      this.get('onBoardingStatus').updateStatus('setup', {'messenger.setup': '1'});
    },

    addAgents() {
      this.set('agentSetup', 'add');
    },

    skipAgents() {
      this.set('activePopup', 0);
      this.set('grayoutAgents', true);
      this.get('onBoardingStatus').updateStatus('agent_added', {'user.agent_added': '1'});
    },

    rowsChanged(action, rowsCount) {
      this.set('agentsRows', rowsCount);
    }
  }
});

