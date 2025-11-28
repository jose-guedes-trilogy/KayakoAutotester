import { on } from '@ember/object/evented';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import DS from 'ember-data';
import _ from 'npm:lodash';

export default DS.RESTAdapter.extend({
  namespace: '/api/v1',
  session: service(),
  errorHandler: service(),
  requestHistory: service(),
  notificationHandler: service('error-handler/notification-strategy'),
  serverClock: service(),
  adapterRequestLogger: service(),

  /**
    Automatically add `include=*` query param to all requests.

    Override in subclasses of the adapter to disable this mode for certain endpoints.

    To override this setting at find-time, use `{ include: [] }` to include
    nothing and `{ include: 'foo,bar' }` to specify exactly.

    @property autoIncludeAll
    @type boolean
    @default true
  */
  autoIncludeAll: true,

  /*
   * Each time we findAll on a model, we check to see if we've
   * loaded it - we don't reload the model once this has happened.
   * (all new models will be pushed to the store via KRE)
   */
  foundAllHash: null,

  initFoundAllHash: on('init', function () {
    this.set('foundAllHash', {});
  }),

  // CPs
  headers: computed('session.sessionId', 'session.csrfToken', function () {
    let { sessionId, csrfToken } = this.get('session').getProperties('sessionId', 'csrfToken');

    let headers = {
      Accept: 'application/json',
      'X-Options': 'flat',
      'X-Requested-With': 'XMLHttpRequest',
      'X-API-Token': '440be73f-7a9a-492f-a88b-745e5affb049'
    };

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    if (sessionId) {
      headers['X-Session-ID'] = sessionId;
    }

    return headers;
  }).volatile(),

  handleResponse: function(status, headers, payload) {
    if (headers['date-iso']) {
      this.get('serverClock').set('lastKnownServerTime', headers['date-iso']);
    }
    if (this.isSuccess(status, headers, payload)) {
      return payload;
    } else {
      let errors = this.normalizeErrorResponse(status, headers, payload);
      if (this.isInvalid(status, headers, payload)) {
        return new DS.InvalidError(errors);
      } else {
        return new DS.AdapterError(errors);
      }
    }
  },

  normalizeErrorResponse(status, headers, payload = {}) {
    let errors = payload.errors || [];

    // Sneaks the auth token into auth-related errors
    if (payload.auth_token) {
      errors
      .filter(e => ['CREDENTIAL_EXPIRED', 'OTP_EXPECTED'].includes(e.code))
      .forEach((error) => error.authToken = payload.auth_token);
    }

    // Since we can only return array, we have to merge notifications
    // into errors and assign NOTIFICATION code to tell them apart
    let notifications = payload.notifications || [];
    notifications.forEach((n) => {
      n.code = 'NOTIFICATION';
    });

    return errors.concat(notifications);
  },

  handleErrors(promise) {
    return promise.then(data => {
      this.get('notificationHandler').processAll(data && data.notifications);
      return data;
    }, e => {
      return this.get('errorHandler').process(e);
    });
  },

  isInvalid(status, header, payload) {
    let isValidationError = responseError => [
      'FIELD_REQUIRED',
      'FIELD_DUPLICATE',
      'FIELD_EMPTY',
      'FIELD_INVALID'
    ].includes(responseError.code);

    let hasValidationErrors = responseErrors => _.some(responseErrors, isValidationError);

    return status === 422 || hasValidationErrors(payload.errors);
  },

  ajax(path, type, options = {}) {
    let request = this._super(...arguments);

    this.get('requestHistory').push({
      path, type, data: options.data, request, headers: this.get('headers'), cookies: document.cookie
    });

    return this.handleErrors(request);
  },

  ajaxOptions(url, type, options = {}) {
    let includeSpecified = options.data && 'include' in options.data;
    let shouldAutoIncludeAll = !includeSpecified && this.autoIncludeAll;

    if (shouldAutoIncludeAll) {
      if (type === 'GET') {
        options.data = options.data || {};
        if (!options.data.include) {
          options.data.include = '*';
        }
      } else {
        if (url.indexOf('include=') === -1) {
          if (url.indexOf('?') > -1) {
            url = `${url}&include=*`;
          } else {
            url = `${url}?include=*`;
          }
        }
      }
    }

    return this._super(url, type, options);
  },

  shouldReloadAll(store, snapshotArray) {
    const model = snapshotArray.type;
    const modelName = model.modelName;
    const hasBeenRequested = this.get('adapterRequestLogger').hasRequestedAllRecords(modelName);

    this.get('adapterRequestLogger').setRequestedAllRecords(modelName);

    return !hasBeenRequested;
  },

  shouldBackgroundReloadAll() {
    return false;
  },

  shouldBackgroundReloadRecord() {
    return false;
  }
});
