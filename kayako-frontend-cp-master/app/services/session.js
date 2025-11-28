/* eslint-disable no-console */
import ENV from 'frontend-cp/config/environment';
import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import RSVP from 'rsvp';
import Ember from 'ember';
import { getMetaData } from 'frontend-cp/utils/bugsnag';
import { getOwner } from '@ember/application';
import moment from 'moment';
import { variation } from 'ember-launch-darkly';
import { getImpersonationHash, removeImpersonationHash } from 'frontend-cp/utils/hash-params';

export const sessionIdCookieName = ENV.sessionIdCookieName;
export const rememberMeCookieName = ENV.rememberMeCookieName;
const domainParts = window.location.hostname.split('.');
// Top-level domains, such as novo or localhost, won't work, so we need to set this to the empty string
export const sessionIdCookieDomain = domainParts.length > 1 ? '.' + domainParts.join('.') : '';

// Upon instance creation, a session cookie is be set on kayako.com, and the user
// gets redirected to the domain of the new instance. We should clean this cookie as
// soon as the user logs in.
const kayakoDomain = domainParts.length > 2 ? '.' + domainParts.slice(1).join('.') : null;

// secure cookies don't work in test because they are run over http not https
export const secureCookies = ENV.environment !== 'test';

// Far future date to use for remember me cookies so they don't expire
const REMEMBER_ME_EXPIRY_DATE = moment().add(10, 'years').toDate();

// Set impersonation token token received from kayako website
const IMPERSONATION_TOKEN = getImpersonationHash(window.location.hash);
const WINDOW_HASH = removeImpersonationHash(window.location.hash);

if (IMPERSONATION_TOKEN) {
  history.replaceState(undefined, undefined, `${window.location.pathname}${window.location.search}${WINDOW_HASH}`);
}

export default Service.extend({

  /**
   * Property for use in computed properties and observers
   * Ember automatically converts this to an ember array.
   * @type {Array}
   */
  session: null,
  user: null,
  email: null,
  password: null,
  rememberMe: false,
  refreshSession: false,
  otp: null,
  authToken: null,

  permissions: [],

  planService: service('plan'),
  localStore: service(),
  notification: service(),
  i18n: service(),
  store: service(),
  locale: service(),
  moment: service(),
  cookies: service(),
  impersonationToken: IMPERSONATION_TOKEN,

  // CPs
  sessionId: computed({
    get() {
      return this._getSessionIdCookie();
    },
    set(_, id) {
      if (id) {
        this._setSessionIdCookie(id);
      } else {
        this._removeSessionIdCookie();
      }
      return id;
    }
  }).volatile(),

  rememberMeToken: computed({
    get() {
      return this._getRememberMeCookie();
    },
    set(_, token) {
      if (token) {
        this._setRememberMeCookie(token);
      } else {
        this._removeRememberMeCookie();
      }
      return token;
    }
  }).volatile(),

  csrfToken: computed({
    get() {
      return this.get('localStore').getItem(ENV.localStore.defaultNamespace, 'csrf', { persist: true });
    },
    set(_, token) {
      if (token) {
        this.get('localStore').setItem(ENV.localStore.defaultNamespace, 'csrf', token, { persist: true });
      } else {
        this.get('localStore').removeItem(ENV.localStore.defaultNamespace, 'csrf', { persist: true });
      }
      return token;
    }
  }).volatile(),

  // Methods
  clear(parameters = {}) {
    if (variation('release-remember-me')) {
      parameters = Object.assign({
        sessionId: true,
        session: true,
        csrfToken: true,
        rememberMeToken: false,
        localStore: true
      }, parameters);

      const updatedProperties = {};

      if (parameters.sessionId)        { updatedProperties.sessionId = null; }
      if (parameters.session)          { updatedProperties.session = null; }
      if (parameters.csrfToken)        { updatedProperties.csrfToken = null; }
      if (parameters.rememberMeToken)  { updatedProperties.rememberMeToken = null; }

      this.setProperties(updatedProperties);

      if (parameters.localStore) {
        this.get('localStore').clearAllByNamespace(ENV.localStore.defaultNamespace);
      }
    } else {
      this.setProperties({
        sessionId: null,
        session: null,
        csrfToken: null
      });

      this.get('localStore').clearAllByNamespace(ENV.localStore.defaultNamespace);
    }

  },

  _getSessionWrapper() {
    // sessionId saved in local storage
    return this._getSession().catch((e) => {
      this.clear();

      if (console && console.error) {
        console.error(e);
      }

      throw e;
    });
  },

  impersonationLogin() {
    return this._getSession().catch((e) => {
      this.clear();
      this.set('impersonationToken', 'error');

      if (console && console.error) {
        console.error(e);
      }

      throw e;
    });
  },

  userPassLogin() {
    if (!this.get('sessionId')) {
      this.clear();
      return RSVP.reject(new Error('No session ID'));
    }

    if (!this.get('csrfToken')) {
      this.clear();
      return RSVP.reject(new Error('No CSRF Token'));
    }

    return this._getSessionWrapper();
  },

  rememberMeLogin() {
    return this._getSessionWrapper();
  },

  getSession() {
    let session = this.get('session');

    if (session) {
      return RSVP.resolve(session);
    }

    if (this.get('impersonationToken') !== '') {
      return this.impersonationLogin();
    }

    if (variation('release-remember-me')) {
      let rememberMeToken = this.get('rememberMeToken');
      if (rememberMeToken) {
        return this.rememberMeLogin();
      }
    }

    return this.userPassLogin();
  },

  _getSessionIdCookie() {
    return this.get('cookies').read(sessionIdCookieName);
  },

  _setSessionIdCookie(sessionId) {
    this.get('cookies').write(sessionIdCookieName, sessionId, {
      domain: sessionIdCookieDomain,
      path: '/',
      secure: secureCookies
    });
  },

  _removeSessionIdCookie() {
    this.get('cookies').clear(sessionIdCookieName, {
      domain: sessionIdCookieDomain,
      path: '/',
      secure: secureCookies
    });
  },

  _getRememberMeCookie() {
    return this.get('cookies').read(rememberMeCookieName);
  },

  _setRememberMeCookie(rememberMeToken) {
    this.get('cookies').write(rememberMeCookieName, rememberMeToken, {
      domain: sessionIdCookieDomain,
      path: '/',
      secure: secureCookies,
      expires: REMEMBER_ME_EXPIRY_DATE
    });
  },

  _removeRememberMeCookie() {
    this.get('cookies').clear(rememberMeCookieName, {
      domain: sessionIdCookieDomain,
      path: '/',
      secure: secureCookies
    });
  },

  _removeKayakoSessionIdCookie() {
    if (kayakoDomain) {
      this.get('cookies').clear(sessionIdCookieName, {
        domain: kayakoDomain,
        path: '/',
        secure: secureCookies
      });
    }
  },

  _getSession() {
    let queryParams = {};

    if (variation('release-remember-me')) {
      if (this.get('rememberMe')) {
        queryParams.remember_me = true;
      }
    }

    return this.get('store').queryRecord('session', queryParams)
      .then((session) => {
        if (session.get('user.role.roleType') === 'CUSTOMER') {
          return this._handleAttemptedCustomerLogin();
        }

        this.set('session', session);
        this._removeKayakoSessionIdCookie();
        this.set('sessionId', session.get('id'));

        if (session.get('rememberMeToken')) {
          this.set('rememberMeToken', session.get('rememberMeToken'));
        }
        if (session.get('csrfToken')) {
          this.set('csrfToken', session.get('csrfToken'));
        }

        return this.get('planService').fetchPlan();
      }).then(() => {
        this.get('store').unloadAll('permission');
        return this.get('store').queryRecord('user', { id: 'me' }).then((me) => {
          this.set('user', me);
          this.get('store').query('channel', { user_id: me.get('id') });
          if (me.get('timeZone')) {
            this.get('moment').changeTimeZone(me.get('timeZone'));
          }

          // The /me endpoint returns sideloaded permissions, but not enough for ember-data to
          // establish relationships. We can receive other permissions which do not belong to this user
          // when administrating permissions, so we need to break the mapping to the store
          let permissions = this.get('store').peekAll('permission').map(permission => permission);
          this.set('permissions', permissions);
        });
      });
  },

  logout() {
    let store = this.get('store');

    return store.adapterFor('session').deleteSession()
      .then(() => this._saveUserLocale())
      .then(() => this.clear({ rememberMeToken: true }))
      .finally(() => this._redirectToLogin());
  },

  _saveUserLocale() {
    const userLocale = this.get('user.locale');
    if (userLocale) {
      this.get('locale').persistLocaleToLocalStorage(userLocale);
    }

    return RSVP.resolve();
  },

  _redirectToLogin() {
    let store = this.get('store');
    let redirectToLogin = () => {
      window.location = '/agent/login';
    };

    this.clear();

    return store.findAll('auth-provider')
      .then(providers => {
        let ssoProvider = providers.findBy('scheme', 'SSO');
        if (ssoProvider) {
          window.location = ssoProvider.get('logoutUrl');
        } else {
          redirectToLogin();
        }
      })
      .catch(() => redirectToLogin());
  },

  reportSessionExpiry(reason) {
    const context = getMetaData(null, getOwner(this));
    const setting = this.get('store').peekAll('setting').findBy('key', 'security.agent.session_expiry');
    const expiry = (setting && parseInt(setting.get('value'))) || 8;

    let lastActivityAt = moment.utc(this.get('session.lastActivityAt'));
    let now = moment.utc();
    let diff = now.diff(lastActivityAt, 'hours', true);

    if (diff < expiry) {
      context.involuntaryLogout = {
        expectedExpiry: expiry,
        actualExpiry: diff,
        isInvoluntary: true
      };
    }

    if (!Ember.testing && window.Bugsnag) {
      window.Bugsnag.notify('SessionExpired', reason, context, 'info');
    }
  },

  /**
   * Sends email and password to backend for authentication.
   * @param  {string} email - email
   * @param  {string} password - password
   * @return {Promise} RSVP.Promise containing session
   */
  requestSession({ email, password, rememberMe, otp, authToken }) {
    let unset = () => {
      this.set('email', null);
      this.set('password', null);
      if (variation('release-remember-me')) {
        this.set('rememberMe', false);
        this.set('otp', null);
        this.set('authToken', null);
      }
    };

    if (variation('release-remember-me')) {
      this.setProperties({ email, password, rememberMe, otp, authToken });
    } else {
      this.setProperties({ email, password });
    }

    return this._getSession()
      .then(unset, (e) => {
        unset();
        throw e;
      });
  },

  _handleAttemptedCustomerLogin() {
    this.get('notification').add({
      type: 'error',
      title: this.get('i18n').t('generic.permissions_denied'),
      autodismiss: true,
      dismissable: true
    });

    return RSVP.Promise.reject(new Error('Customers cannot log into the agent panel'));
  }
});
