import EmberObject from '@ember/object';
import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import { replaceActionUrl } from 'frontend-cp/lib/sso-url-parsing';
import { variation } from 'ember-launch-darkly';
import { getMetaData } from 'frontend-cp/utils/bugsnag';
import { getOwner } from '@ember/application';

export default Route.extend({
  caseListTab: service('case-list-tab'),
  errorHandler: service(),
  locale: service(),
  localStoreService: service('localStore'),
  sessionService: service('session'),
  store: service(),
  windowService: service('window'),
  notification: service(),

  beforeModel(transition) {
    this.get('caseListTab').cancelCasePolling();

    let error = this.paramsFor('login-agent').error;
    if (error) {
      this.get('notification').add({
        type: 'error',
        title: error,
        autodismiss: true
      });
    }

    let store = this.get('store');
    let bypassSso = this.paramsFor('login-agent').bypassSso;
    let windowService = this.get('windowService');

    let loggedIn = () => {
      if (variation('ops-remember-me-bugsnag-logging')) {
        const context = getMetaData(null, getOwner(this));
        const isARememberMeLogin = Boolean(this.get('sessionService.rememberMeToken') || this.get('sessionService.rememberMe'));
        if (isARememberMeLogin) {
          window.Bugsnag.notify('RememberMeLogin', 'User was logged in in rememberMe mode', context, 'info');
        }
      }

      this.transitionTo('session.agent');
    };

    let notLoggedIn = () => {
      if (variation('release-remember-me')) {
        if (variation('ops-remember-me-bugsnag-logging')) {
          const context = getMetaData(null, getOwner(this));
          const isARememberMeLogout = Boolean(this.get('sessionService.rememberMeToken'));
          if (isARememberMeLogout) {
            window.Bugsnag.notify('RememberMeLogout', 'User was logged out despite a remember me token being present', context, 'info');
          }
        }

        this.get('sessionService').clear({ rememberMeToken: true });
      }
      return store.findAll('auth-provider')
        .then(providers => {
          let ssoProvider = providers.findBy('scheme', 'SSO');
          if (ssoProvider && bypassSso !== 'true') {
            transition.abort();
            let url = ssoProvider.get('loginUrl');
            url = replaceActionUrl(url, windowService.currentPath());
            window.location = url;
          }
        }).catch(() => {
          // if we fail to get the auth providers, carry on to the login screen
        });
    };

    return this.get('errorHandler')
      .disableWhile(() => this.get('locale').setup())
      .then(() => this.get('sessionService').getSession().then(loggedIn, notLoggedIn) );
  },

  model() {
    let model = EmberObject.create({
      email: '',
      password: ''
    });

    return RSVP.hash({
      model: model,
      authProviders: this.get('store').findAll('auth-provider')
    });
  },

  setupController(controller, model) {
    controller.setProperties(model);
  },

  actions: {
    willTransition() {
      this.get('controller').reset();
    }
  }
});
