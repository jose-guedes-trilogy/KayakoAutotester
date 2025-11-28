/* eslint-disable no-console */

import EmberError from '@ember/error';

import { computed } from '@ember/object';

import { validateEmailFormat } from 'frontend-cp/utils/format-validations';

import { htmlSafe } from '@ember/string';
import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { on } from '@ember/object/evented';
import { observer } from '@ember/object';
import { run, next as runNext } from '@ember/runloop';
import { A } from '@ember/array';
import RSVP from 'rsvp';
import jQuery from 'jquery';
import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  sessionService: service('session'),
  notificationService: service('notification'),
  errorHandler: service('error-handler'),
  windowService: service('window'),
  i18n: service(),
  locale: service(),
  deviceFingerprint: service(),
  onBoardingStatus: service(),
  store: service(),

  newPassword1: '',
  otp: '',
  newPassword2: '',
  forgotPasswordMessage: '',
  fieldErrors: [],
  avatarBackground: null,
  validAvatar: false,
  isContentDown: false,
  prevLoginState: null,
  topFormSet: null,
  bottomFormSet: null,
  authToken: null,
  authProviders: null,
  rememberMe: false,

  queryParams: ['bypassSso', 'error'],
  bypassSso: 'false',
  error: '',

  /**
   * The current state as a dot separated list
   * representing the state hierarchy
   * @type {String}
   */
  _currentState: '',

  init() {
    this.reset();
    this._super(...arguments);
  },

  /**
   * An object tree representing all possible
   * states and their parent/child relationships
   * @type {Object}
   */
  stateMap: {
    login: {
      password: {
        input: {},
        loading: {},
        confirmed: {},
        error: {}
      },
      otp: {
        input: {},
        loading: {},
        confirmed: {},
        error: {}
      },
      resetPassword: {
        input: {},
        loading: {},
        confirmed: {},
        error: {}
      }
    },
    forgotPassword: {
      input: {},
      loading: {},
      confirmed: {},
      error: {}
    }
  },

  // Observers
  actionButtonText: computed('currentState', function() {
    if (this.get('currentState') === 'login.resetPassword.input') {
      return this.get('i18n').t('login.updatepassword');
    } else {
      return this.get('i18n').t('login.login');
    }
  }),

  flipAvatar: computed('validAvatar', 'avatarBackground', function () {
    return this.get('validAvatar') && this.get('avatarBackground');
  }),

  emailValidDidChange: on('render', observer('emailValid', function() {
    if (this.get('emailValid')) {
      this.requestAvatar(this.get('model.email'));
    }
  })),

  sessionDidClear: on('init', observer('sessionService.session.id', function() {
    if (this.get('sessionService.session.id') === null) {
      this.setState('login.password.input');
    }
  })),

  currentStateDidChange: on('init', observer('currentState', function() {
    let currentState = this.get('currentState');

    // Ignore anything outside the login root state
    if (!this.isInState('login', currentState)) {
      this.set('prevLoginState', currentState);
      return;
    }

    let stateMeta = {
      password: {
        order: 0,
        component: 'ko-login/password'
      },
      otp: {
        order: 1,
        component: 'ko-login/otp'
      },
      resetPassword: {
        order: 2,
        component: 'ko-login/reset'
      }
    };

    let prevState = this.get('prevLoginState');
    let currentSubState = this.getStateAtLevel(1, currentState);
    let prevSubState = this.getStateAtLevel(1, prevState);
    let currentStateMeta = stateMeta[currentSubState];
    let prevStateMeta = stateMeta[prevSubState];
    let isContentDown = null;

    // Only items within login level 0 state should animate up / down
    if (this.getStateAtLevel(0, prevState) === 'login') {

      /**
       * Determine the direction of movement depending on 'order' of item
       * Eg. moving from password to otp will move down,
       * otp to resetPassword will move down again
       * resetPassword to password will move up (once, we don't want to go 'past' otp)
       */

      // This should explicitly do nothing if the orders are equal
      if (currentStateMeta.order > prevStateMeta.order) {
        isContentDown = true;
      } else if (currentStateMeta.order < prevStateMeta.order) {
        isContentDown = false;
      }

      // Place content area in pre-animation state
      run(() => {
        // Choose where to place the prev and next components
        this.setProperties({
          topFormSet: isContentDown ? prevStateMeta.component : currentStateMeta.component,
          bottomFormSet: isContentDown ? currentStateMeta.component : prevStateMeta.component
        });

        if (currentSubState !== prevSubState) {
          // Move content to show the previous component
          this.set('isContentDown', !isContentDown);
        }
      });

      // In next run loop run the animation
      runNext(() => {
        this.set('isContentDown', isContentDown);
      });
    }

    // Store prevState for comparison
    this.set('prevLoginState', currentState);
  })),


  // Computed Properties

  /**
   * Active notifications
   * @return {Object[]} Array of notification objects
   */
  notifications: computed('notificationService.notifications.[]', function() {
    let notificationService = this.get('notificationService');
    return notificationService.get('notifications');
  }),

  isLogin: computed('currentState', 'prevLoginState', function() {
    let currentState = this.get('currentState');
    let prevState = this.get('prevLoginState');
    let isInLogin = this.isInState('login', currentState);
    let wasInLogin = this.isInState('login', prevState);
    if (isInLogin !== wasInLogin) {
      this.clearErrors();
    }
    return isInLogin;
  }),

  isLoading: computed('currentState', function() {
    return this.endsWithSubState('loading', this.get('currentState'));
  }),

  isOtp: computed('currentState', function() {
    return this.isInState('login.otp', this.get('currentState'));
  }),

  isPassword: computed('currentState', function() {
    return this.isInState('login.password', this.get('currentState'));
  }),

  isResetPassword: computed('currentState', function() {
    return this.isInState('login.resetPassword', this.get('currentState'));
  }),

  isError: computed('currentState', function() {
    return this.endsWithSubState('error', this.get('currentState'));
  }),

  isForgotPasswordEmailSent: computed('currentState', function() {
    return this.isInState('forgotPassword.confirmed', this.get('currentState'));
  }),

  emailValid: computed('model.email', function() {
    return validateEmailFormat(this.get('model.email'));
  }),

  passwordValid: computed('model.password', function() {
    return this.get('model.password').length > 0;
  }),

  canAttemptLogin: computed('emailValid', 'passwordValid', function() {
    return this.get('emailValid') && this.get('passwordValid');
  }),

  googleLoginLink: computed('authProviders', function() {
    let googleProvider = this.get('authProviders').findBy('id', 'GIA');
    if (googleProvider) {
      return googleProvider.get('loginUrl').replace('#action#', this._getLoginRedirectPath());
    }
    return null;
  }),

  loginButtonDisabled: computed(
    'canAttemptLogin',
    'isLoading',
    'newPasswordValid',
    'isResetPassword',
    function() {
      return !this.get('canAttemptLogin') ||
        this.get('isLoading') ||
        !this.get('newPasswordValid') && this.get('isResetPassword');
    }
  ),

  resetButtonDisabled: computed('isLoading', 'emailValid', function () {
    return this.get('isLoading') || !this.get('emailValid');
  }),

  newPasswordValid: computed('newPassword1', 'newPassword2', function() {
    let password1 = this.get('newPassword1');
    let password2 = this.get('newPassword2');
    return password1 === password2 && !!(password1) && password1.length > 7;
  }),

  hasErrorMessages: computed('fieldErrors.[]', function() {
    return this.get('fieldErrors').length > 0;
  }),

  errorMessages: computed('fieldErrors.[]', function() {
    return this.get('fieldErrors').map(this.transformMessages.bind(this));
  }),

  /**
   * Read-only current state property
   * For most use cases use isInState, used mostly as a property
   * in computed properties to observe when state changes
   * @return {String} current state as a dot separated list representing the state hierarchy
   */
  currentState: computed('_currentState', function () {
    return this.get('_currentState');
  }),

  // Methods
  transformMessages(error) {
    if ((error.code === 'FIELD_REQUIRED' || error.code === 'FIELD_INVALID') && error.parameter === 'email') {
      return this.get('i18n').t('login.error.invalid_email');
    } else if (error.code === 'ASSOCIATE_NOT_FOUND' && error.parameter === 'email') {
      return this.get('i18n').t('login.error.email_not_found');
    } else {
      return error.message;
    }
  },

  setErrors(errors) {
    this.set('fieldErrors', new A(errors));
  },

  clearErrors() {
    this.set('fieldErrors', []);
  },

  resetRequest(params) {
    return new RSVP.Promise((resolve, reject) => {
      jQuery.ajax({
        type: 'PUT',
        url: '/api/v1/base/profile/password',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        dataType: 'json',
        data: jQuery.param(params),
        headers: {'X-Token': this.get('authToken'), 'X-CSRF': true},
        success(data, status, xhr) {
          data.csrf_token = xhr.getResponseHeader('x-csrf-token');
          resolve(data);
        },
        error(xhr) {
          reject(xhr.responseText);
        }
      });
    });
  },

  otpRequest(otp) {
    if (variation('release-remember-me')) {
      return this.get('sessionService').requestSession({
        otp,
        authToken: this.get('authToken'),
        rememberMe: this.get('rememberMe')
      });
    } else {
      return new RSVP.Promise((resolve, reject) => {
        jQuery.ajax({
          type: 'GET',
          url: '/api/v1/session',
          contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
          dataType: 'json',
          headers: {'X-Token': this.get('authToken'), 'X-OTP': otp, 'X-CSRF': true},
          success(data, status, xhr) {
            data.csrf_token = xhr.getResponseHeader('x-csrf-token');
            resolve(data);
          },
          error(xhr) {
            reject(xhr.responseText);
          }
        });
      });
    }
  },

  sendPasswordResetRequest(params) {
    return new RSVP.Promise((resolve, reject) => {
      jQuery.ajax({
        type: 'POST',
        url: '/api/v1/base/password/reset',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        dataType: 'json',
        data: jQuery.param(params),
        success(data) {
          resolve(data);
        },
        error(xhr) {
          reject(xhr.responseText);
        }
      });
    });
  },

  requestAvatar(email) {
    //This endpoint is won't work for alpha 1 launch
    jQuery.ajax({
      type: 'POST',
      url: '/admin/index.php?/Base/Avatar/JSON/0/200',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      dataType: 'json',
      data: jQuery.param({email: email}),
      success: (response) => {
        /**
         * data.is_user dictates whether or not the returned image was gravatars
         * default image or not, if it was, we do not want to flip, treat it as a failed
         * call
         */

        let valid = !!response.data.is_user;

        this.set('validAvatar', valid);
        if (valid) {
          this.set('avatarBackground', response.data.data);
        }
      },
      error() {
        if (console && console.warn) {                // eslint-ignore-line
          console.warn('Avatar loading failed');      // eslint-ignore-line
        }
      }
    });
  },

  _onSuccessLogin() {
    this.setState('login.password.confirmed');
    this._redirectOrTransitionToSession();
  },

  _getLoginRedirectPath() {
    let attemptedTransition = this.get('sessionService.attemptedTransition');
    let redirectPath = this.get('sessionService.loginRedirectPath');

    if (attemptedTransition && attemptedTransition.intent && attemptedTransition.intent.url) {
      return attemptedTransition.intent.url;
    } else if (redirectPath) {
      return redirectPath;
    } else {
      return this.get('windowService').currentPath();
    }
  },

  _redirectOrTransitionToSession() {
    let attemptedTransition = this.get('sessionService.attemptedTransition');
    let redirectPath = this.get('sessionService.loginRedirectPath');

    if (attemptedTransition) {
      this.set('sessionService.attemptedTransition', null);
      attemptedTransition.retry();
    } else if (redirectPath) {
      this.set('sessionService.loginRedirectPath', null);
      this.transitionToRoute(redirectPath);
    } else {
      this.transitionToRoute('session.agent');
    }
  },

  _requestSession() {
    if (variation('release-remember-me')) {
      return this.get('sessionService').requestSession({ email: this.get('model.email'), password: this.get('model.password'), rememberMe: this.get('rememberMe') });
    }
    return this.get('sessionService').requestSession({ email: this.get('model.email'), password: this.get('model.password') });
  },

  login() {
    const locale = this.get('locale');
    this.setState('login.password.loading');
    this._requestSession()
      .then(() => {
        const userLocaleCode = this.get('sessionService.user.locale.locale');

        if (locale.getLocaleCodeFromLocalStorage() !== userLocaleCode) {
          locale.setup().then(() => {
            this._onSuccessLogin();
          });
        } else {
          this._onSuccessLogin();
        }
      }, (error) => {
        let errors = error.errors || [];
        let errorCodes = errors.map((error) => error.code);

        if (errorCodes.indexOf('AUTHENTICATION_FAILED') > -1) {
          this.setState('login.password.error');
          this.setErrors([{ message: this.get('i18n').t('login.error.login_failed') }]);
        } else if (errorCodes.indexOf('CREDENTIAL_EXPIRED') > -1) {
          let authToken = errors[errorCodes.indexOf('CREDENTIAL_EXPIRED')].authToken;
          this.set('authToken', authToken);
          this.setState('login.resetPassword.input');
        } else if (errorCodes.indexOf('OTP_EXPECTED') > -1) {
          // User needs to enter one time password for two factor authentication
          let authToken = errors[errorCodes.indexOf('OTP_EXPECTED')].authToken;
          this.set('authToken', authToken);
          this.setState('login.otp.input');
        } else if (error instanceof EmberError) {
          // this should never happen in production, but it might happen
          // on development stage when we have problems with models
          // (or similar)
          this.setState('login.password.error');
          this.setErrors([{ message: 'System error, please contact Customer Support'}]);
        } else {
          this.setState('login.password.error');
        }
      });
  },

  resetPassword() {
    this.setState('login.resetPassword.loading');
    this.setErrors([]);

    this.resetRequest({
      password: this.get('model.password'),
      new_password: this.get('newPassword1')
    })
    .then((response) => {
      this.get('notificationService').removeAll();
      if (response.session_id) {
        this.setupSessionFromResponse(response);
        this._redirectOrTransitionToSession();
      } else {
        this.setState('login.resetPassword.error');
        this.setErrors({ message: 'Session missing'});
      }
    }, (response) => {
      this.setState('login.resetPassword.error');
      let data = JSON.parse(response);
      this.setErrors(data.notifications);
      this.get('errorHandler').processErrors(data.errors);
      this.get('errorHandler').process();
    });
  },

  submitOtp() {
    this.setState('login.otp.loading');
    this.setErrors([]);

    if (!variation('release-remember-me')) {
      this.otpRequest(this.get('otp')).then((response) => {
        this.get('notificationService').removeAll();
        if (response.session_id) {
          this.setState('login.otp.confirmed');
          this.setupSessionFromResponse(response);
          this._redirectOrTransitionToSession();
        } else {
          this.setState('login.otp.error');
          this.setErrors([{message: 'Session missing'}]);
        }
      }, (response) => {
        this.setState('login.otp.error');
        let data = JSON.parse(response);
        this.setErrors(data.notifications);
        this.get('errorHandler').processErrors(data.errors);
        this.get('errorHandler').process();
      });
      return;
    }

    this.otpRequest(this.get('otp')).then(() => {
      this.get('notificationService').removeAll();
      if (this.get('sessionService.sessionId')) {
        this.setState('login.otp.confirmed');
        this._redirectOrTransitionToSession();
      } else {
        this.setState('login.otp.error');
        this.setErrors([{message: 'Session missing'}]);
      }
    }, () => {
      this.setState('login.otp.error');
    });
  },

  setupSessionFromResponse(response) {
    const session = this.get('sessionService');
    session.setProperties({
      sessionId: response.session_id,
      csrfToken: response.csrf_token
    });
  },

  /**
   * Sets the current state as a dot separated
   * list representing the desired state hierarchy
   * eg. 'root.session.foo'
   * Throws an error if the state is not available
   * in the stateMap object tree
   * @param {String} state Dot separated string of state hierarchy
   */
  setState(state) {
    if (this.get('stateMap.' + state)) {
      this.set('_currentState', state);
    } else {
      throw new Error('Invalid state: ' + state);
    }
  },

  /**
   * Returns true if you are in the current state, you must specify the currentState
   * in order force a call to this.get('currentState') in computed properties,
   * otherwise the computed property will not be called.
   * or any of its parent states
   * @param  {String}  state Dot separated string of state hierarchy
   * @param  {String}  currentState Dot separated string of state hierarchy
   * @return {Boolean}
   */
  isInState(state, currentState) {
    if (typeof currentState === 'undefined') {
      throw new Error('currentState is not defined');
    }
    return currentState.indexOf(state) === 0;
  },

  /**
   * Returns true if the last substate in the state string
   * is the leafState/s
   * @param  {String}  subState     Dot separated string of sub-state
   * @param  {String}  currentState currentState Dot separated string of state hierarchy
   * @return {Boolean}
   */
  endsWithSubState(subState, currentState) {
    if (typeof currentState === 'undefined') {
      throw new Error('currentState is not defined');
    }
    return currentState.indexOf(subState) === currentState.length - subState.length;
  },

  getStateAtLevel(level, currentState) {
    currentState = currentState || this.get('_currentState');
    return currentState.split('.')[level];
  },

  /**
   * Need to SafeString all bound style attributes
   */

  loginFrontImageStyle: computed(function() {
    return htmlSafe('background-image: url(\'/images/login/avatar.png\');');
  }),

  loginBackImageStyle: computed('avatarBackground', function() {
    if (this.get('avatarBackground')) {
      return htmlSafe(`background-image: url("${ this.get('avatarBackground') }");`);
    } else {
      return htmlSafe('');
    }
  }),


  actions: {
    login(e) {
      e.preventDefault();
      this.setErrors([]);

      if (!this.isInState('login', this.get('currentState'))) {
        return;
      }

      let funcMap = {
        password: this.login,
        resetPassword: this.resetPassword,
        otp: this.submitOtp
      };

      Reflect.apply(funcMap[this.getStateAtLevel(1)], this, []);
    },

    gotoForgotPassword() {
      if (!this.get('isLoading')) {
        this.setState('forgotPassword.input');
      }
    },

    gotoLogin() {
      if (!this.get('isLoading')) {
        this.setState('login.password.input');
      }
    },

    redirectToGoogle(e) {
      e.preventDefault();
      window.location.href = this.get('googleLoginLink');
    },

    sendForgotPasswordEmail(e) {
      e.preventDefault();
      this.setState('forgotPassword.loading');
      this.setErrors([]);
      this.sendPasswordResetRequest({ email: this.get('model.email') })
      .then(() => {
        this.setState('forgotPassword.confirmed');
        this.set('forgotPasswordMessage', 'An email with a reset link has been sent to your inbox');
      }, (response) => {
        let data = JSON.parse(response);
        this.setState('forgotPassword.error');
        this.setErrors(data.errors);
      });
    },

    onNotificationClosed(notification) {
      let notificationService = this.get('notificationService');
      notificationService.remove(notification);
    }
  },

  reset() {
    this.set('otp', '');
    this.setState('login.password.input');
    this.set('prevLoginState', this.get('currentState'));
  }
});
