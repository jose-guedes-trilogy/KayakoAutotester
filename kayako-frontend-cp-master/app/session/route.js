/**
 * SessionRoute
 *
 * This route is resposible for checking the session exists for all its
 * child routes. Since a parent route loads before all its children, no
 * child route will load if the session id is not available.
 *
 * Note that the application route is not a child of this one so the
 * application route needs to check for the session independently.
 *
 * This route also loads all data shared by all its children
 */

import Ember from 'ember';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/route';
import jQuery from 'jquery';
import { variation } from 'ember-launch-darkly';
import ENV from 'frontend-cp/config/environment';
import { getMetaData } from 'frontend-cp/utils/bugsnag';
import { getOwner } from '@ember/application';

export default Route.extend(KeyboardShortcuts, {
  store: service(),
  session: service(),
  analytics: service(),
  // appcues: service(),
  tabStore: service(),
  locale: service(),
  errorHandler: service(),
  caseListTab: service(),
  socket: service(),
  onBoardingStatus: service(),
  processManager: service(),
  notification: service('notification'),
  realtimePush: service(),
  launchDarkly: service(),
  plan: service(),
  apps: service(),
  notificationPreferences: service(),
  profilePreferences: service(),

  keyboardShortcuts: {
    'g c': {
      action: 'goToCases',
      global: false
    },
    'g i': {
      action: 'goToInsights',
      global: false
    },
    'g a': {
      action: 'goToAdmin',
      global: false
    },
    '?': {
      action: 'toggleKeyboardHelp',
      global: false
    },
    esc: {
      action: 'removeFocus',
      global: true
    },
    '/': {
      action: 'openSearch',
      global: false
    }
  },

  beforeModel(transition) {
    // we ignore errors before locale strings are loaded
    return this.get('errorHandler').disableWhile(() => {
      return this.get('session').getSession()
        .then(() => this._setupApp(), () => this._transitionToLogin(transition))
        .catch(error => {
          if (!Ember.testing && window.Bugsnag) {
            window.Bugsnag.notifyException(error, 'Failed setting up app', {}, 'error');
          }

          transition.abort();
          this.get('notification').add({
            type: 'error',
            title: 'Ooops. Something went wrong',
            body: 'We have been notified of this. Refresh to try again.',
            autodismiss: false
          });
        });
    });
  },

  _setupApp() {
    return RSVP.all([
      this.get('analytics').setup(),
      // this.get('appcues').identify(),
      this.get('locale').setup(),
      this.get('store').findAll('brand'),
      this.get('onBoardingStatus').getSettings(),
      this.get('onBoardingStatus').getCompletedCases(),
      this.get('notificationPreferences').loadPreferences(),
      this.get('profilePreferences').loadPreferences(),
      this.setupPush(),
      this.setupKRE(),
      this.setupApps(),
      this._identifyLaunchDarkly()
    ])
    .then(() => this.get('processManager').restoreProcesses());
  },

  _identifyLaunchDarkly() {
    let user = this.get('session.user');

    const props = {
      key: user.get('uuid'),
      anonymous: false,
      email: user.get('primaryEmailAddress'),
      avatar: user.get('avatar'),
      custom: {
        fullName: user.get('fullName'),
        role: user.get('role.roleType'),
        createdAt: user.get('createdAt'),
        instance: this.get('session.session.instanceName'),
        host: window.location.hostname,
        isTrial: this.get('plan.isTrial'),
        appVersion: ENV.currentRevision
      }
    };

    return this.get('launchDarkly').identify(props);
  },


  _transitionToLogin(transition) {
    this.get('session').set('attemptedTransition', transition);
    this.transitionTo('login-agent');
  },

  model() {
    return RSVP.hash({
      brands: this.get('store').peekAll('brand')
    });
  },

  setupController(controller, { brands }) {
    controller.set('brand', brands.findBy('isDefault', true));
  },

  activate() {
    this._super(...arguments);
  },

  setupApps() {
    if (!variation('release-apps')) {
      return;
    }
    const apps = this.get('apps');
    return apps.setup().catch(e => {
      if (apps.get('isDevMode')) {
        this.get('notification').add({
          type: 'error',
          title: 'Failed to connect to local apps server',
          body: 'Ensure "kit server" is running and try again.',
          autodismiss: false
        });
      } else {
        if (!Ember.testing && window.Bugsnag) {
          let context = getMetaData(null, getOwner(this));
          window.Bugsnag.notifyException(e, 'Failed to connect to apps server', context, 'error');
        }
      }
    });
  },

  setupPush () {
    if (!variation('feature-push-notifications')) {
      return RSVP.resolve();
    }
    return this.get('realtimePush').registerUserDevice().catch(e => {}); // swallow failures
  },

  setupKRE() {
    const socket = this.get('socket');

    socket.on('onError', () => {
      this.get('store').queryRecord('user', {id: 'me'}).catch(({ errors }) => {
        if (errors.findBy('code', 'AUTHORIZATION_REQUIRED')) {
          this.transitionTo('login-agent');
        }
      });
    });

    socket.connect({
      instance: this.get('session.session.instanceName'),
      session_id: this.get('session.sessionId'),
      user_agent: window.navigator.userAgent
    }).catch(() => {
      // swallow failures, we display a banner automatically
    });
  },

  actions: {
    willTransition(transition) {
      this.controller.set('searchResults', null);
    },

    openSearchResult(routeName, obj, hasModifier) {
      let tabStore = this.get('tabStore');

      if (hasModifier) {
        tabStore.createTab(routeName, obj);
      } else {
        this.transitionTo(routeName, obj.get('id'));
      }
    },

    transitionToRoute() {
      this.transitionTo(...arguments);
    },

    goToCases() {
      this.transitionTo('session.agent.cases.index');
    },

    goToInsights() {
      this.transitionTo('session.agent.insights');
    },

    goToAdmin() {
      this.transitionTo('session.admin');
    },

    toggleKeyboardHelp() {
      this.get('controller').toggleProperty('showingKeyboardHelp');
    },

    openSearch() {
      this.get('controller').set('isSearchActive', true);
    },

    closeSearch() {
      this.get('controller').set('isSearchActive', false);
    },

    openAdvancedSearch(term) {
      if (term) {
        this.controllerFor('session.agent.search').set('openInANewTab', true);
        this.transitionTo('session.agent.search', term);
      }
    },

    removeFocus() {
      // has to be in the next "tick" otherwise it doesn't remove focus from contenteditable
      setTimeout(() => {
        const focused = document.activeElement;
        if (!focused) {
          return;
        }

        if (jQuery(focused).closest(':input, [contenteditable]').length) {
          focused.blur();
          window.getSelection().removeAllRanges();
        }
      }, 0);
    }
  }
});
