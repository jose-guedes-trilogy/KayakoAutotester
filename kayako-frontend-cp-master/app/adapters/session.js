import $ from 'jquery';
import { computed } from '@ember/object';
import ApplicationAdapter from './application';
import { b64EncodeUnicode } from 'frontend-cp/utils/base64';
import RSVP from 'rsvp';
import { inject as service } from '@ember/service';
import { variation } from 'ember-launch-darkly';

export default ApplicationAdapter.extend({
  deviceFingerprint: service(),

  // CPs
  headers: computed('session.{email,password,sessionId}', function () {
    let sessionId = this.get('session.sessionId');
    let email = this.get('session.email');
    let password = this.get('session.password');
    let authorizationHeader = `Basic ${b64EncodeUnicode(email + ':' + password)}`;
    let withPassword = email && password;
    let fingerprint = this.get('deviceFingerprint').getOrCreate();
    let rememberMeToken = this.get('session.rememberMeToken');
    let impersonationToken = this.get('session.impersonationToken');
    let otp = this.get('session.otp');
    let authToken = this.get('session.authToken');

    let headers = {
      Accept: 'application/json',
      'X-Options': 'flat',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF': true
    };

    if (impersonationToken) {
      headers['X-Impersonation-Token'] = impersonationToken;
    }

    if (!variation('release-remember-me')) {
      if (withPassword) {
        headers.Authorization = authorizationHeader;
      } else {
        headers['X-Session-ID'] = sessionId;
      }
      return headers;
    }

    headers['X-Fingerprint'] = fingerprint;

    const otpMode = otp && authToken;
    if (otpMode) {
      headers['X-Token'] = authToken;
      headers['X-OTP'] = otp;

      return headers;
    }

    if (withPassword) {
      headers.Authorization = authorizationHeader;
    } else if (sessionId) {
      headers['X-Session-ID'] = sessionId;
    }

    if (rememberMeToken) {
      headers['X-RememberMe'] = rememberMeToken;
    }

    return headers;
  }).volatile(),

  // Methods
  buildURL(modelName, id, snapshot, requestType, query) {
    const url = this._buildURL(modelName, id);
    if (requestType === 'deleteRecord') {
      return url.substr(0, url.indexOf(id));
    }
    return url;
  },

  handleResponse(status, headers, payload, requestData) {
    if (this.isSuccess(status, headers, payload)) {
      // currently the server sends lower-case header but documentation says it's capitalized
      // so handle both forms. JQuery handles this with getResponseHeader but we don't have that here
      payload.data.csrf_token = headers['X-CSRF-Token'] || headers['x-csrf-token'];
      if (variation('release-remember-me')) {
        payload.data.remember_me_token = headers['X-RememberMe'] || headers['x-rememberme'];
      }
    }
    return this._super(...arguments);
  },

  pathForType() {
    return 'session';
  },

  deleteSession() {
    let { sessionId, csrfToken } = this.get('session').getProperties('sessionId', 'csrfToken');
    let options = {
      type: 'DELETE',
      url: `${this.namespace}/session`,
      dataType: 'json',
      headers: {
        'X-Session-ID': sessionId,
        'X-CSRF-Token': csrfToken
      }
    };

    return RSVP.resolve()
      .then(() => $.ajax(options));
  }
});
