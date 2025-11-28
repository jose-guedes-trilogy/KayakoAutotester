import Service from '@ember/service';
import moment from 'moment';
import config from 'frontend-cp/config/environment';

const NUM_REQUESTS_TO_KEEP = 3;

const PROMISE_PENDING = undefined; // eslint-disable-line no-undefined
const PROMISE_FULFILLED = 1;
const PROMISE_REJECTED = 2;

export default Service.extend({

  init() {
    this._super(...arguments);
    this._requests = [];
  },

  push({ path, type, data, headers, cookies, request }) {
    this._requests.unshift({
      path,
      type,
      data,
      headers,
      cookies,
      request,
      at: new Date(),
      csid: sessionIdFromCookie(cookies),
      csrf: csrfFromLocalStorage()
    });
    this._requests = this._requests.slice(0, NUM_REQUESTS_TO_KEEP);
  },

  recentSanitized() {
    return this._requests.map(requestInfo);
  }
});

function requestInfo({ path, data, type, headers, cookies, request, at, csid, csrf }) {
  // NOTE - bugsnag needs the result syncronously so we pull data out of Promise#_state & Promise#_result
  return {
    at: moment(at).toISOString(),
    path,
    type,
    headers: sanitizeHeaders(headers),
    csid,
    csrf,
    requestData: sanitizeRequest(data, request._state),
    responseData: sanitizeResponse(request, request._state),
    promise: promiseState(request)
  };
}

function csrfFromLocalStorage() {
  if (window.localStorage) {
    const val = window.localStorage.getItem(`${config.localStore.prefix}:${config.localStore.defaultNamespace}:csrf`);

    if (val) {
      return JSON.parse(val);
    } else {
      return 'MISSING';
    }
  }

  return 'LOCAL STORAGE NOT AVAILABLE';
}

function sessionIdFromCookie(cookies) {
  const match = cookies.match(/novo_sessionid=([^;]+)/);
  return (match && match[1]) || 'MISSING';
}

function sanitizeHeaders(headers) {
  const headersToSend = ['x-session-id', 'x-csrf-token'];
  return Object.keys(headers).reduce((selected, key) => {
    if (headersToSend.includes(key.toLowerCase())) {
      selected[key] = headers[key];
    }
    return selected;
  }, {});
}

function promiseState(promise) {
  switch (promise._state) {
    case PROMISE_PENDING:
      return 'pending';
    case PROMISE_FULFILLED:
      return 'fulfilled';
    case PROMISE_REJECTED:
      return 'rejected';
  }
}

function sanitizeRequest(data, promiseState) {
  if (promiseState === PROMISE_REJECTED) {
    return data;
  }
  return 'redacted';
}

function sanitizeResponse(response, promiseState) {
  if (promiseState === PROMISE_REJECTED) {
    return response._result;
  }

  return 'redacted';
}
