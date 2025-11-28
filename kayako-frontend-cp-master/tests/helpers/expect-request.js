import { copy } from '@ember/object/internals';
import { typeOf } from '@ember/utils';
const STANDARD_RESPONSE = [200, {}, ''];

/**
  Installs a mock endpoint for *exactly* the specified request and adds an
  async-aware assertion that the request will be made at the expected time.
  Example:
  ```js
  expectRequest(pretender, {
    verb: 'POST',
    path: '/favourites',
    headers: {
      Authorization: 'bearer some-cool-token'
    },
    payload: {
      favourite: {
        sport_id: 1,
        position: 0
      }
    },
    response: [
      201,
      { 'Content-Type': 'application/json' },
      '{"favourite":{"id":101,"sport_id":1,"position":0}'
    ]
  });
  ```
  Note that in acceptance tests we monkey patch an `expectRequest` method onto
  the pretender instance returned by `startPretender`. As such you use this
  instead:
  ```js
  pretender.expectRequest({
    // ...
  });
  ```
  @public
  @method expectRequest
  @param {Pretender} [pretender]
  @param {Object} [options]
  @param {String} [options.message]
    Optional message/nickname for this request. Appears in test output.
    Useful for differentiating occurences of requests.
  @param {String} [options.verb]
    The HTTP method to use. Aliased as [options.method].
    Default 'GET'.
  @param {String} [options.path]
    The request path.
    Default '/'.
  @param {Object} [options.headers]
    Expected HTTP headers. We ignore `Accept`, `Content-Type`, and
    `X-Requested-With` for convenience.
    Default { Authorization: 'test-access-token' }.
  @param {Object} [options.payload]
    The expected JSON-encoded body of the request.
    No default
  @param {Object} [options.query]
    The expected query params.
  @param {Number} [options.count]
    The number of times this request is expected to be made.
    Default 1.
  @param {Array|Function} [options.response]
    The response when this request matches in Pretender-standard format
    `[status, headers, body]`.
*/

export default function expectRequest(pretender, options, assert) {
  let message = options.message || 'request';
  let expectedVerb = (options.verb || options.method || 'get').toUpperCase();
  let expectedPath = options.path || '/';
  let expectedHeaders = options.headers || { Authorization: 'bearer test-access-token' };
  let expectedPayload = options.payload || {};
  let expectedQuery = options.query || {};
  let expectedCount = options.count || 1;
  let response = options.response || STANDARD_RESPONSE;
  let actualCount = 0;

  // Create key for this handler. We’ll use it in the generic
  // request handler to pluck this specialised handler from
  // the queue.
  let key = generateKey(
    expectedVerb,
    expectedPath,
    expectedHeaders,
    expectedQuery,
    expectedPayload
  );

  function genericHandler(req) {
    let headers = sanitizeHeaders(req.requestHeaders, expectedHeaders);
    let payload = JSON.parse(req.requestBody) || {};
    let query = req.queryParams;
    let reqKey = generateKey(
      expectedVerb,
      expectedPath,
      headers,
      query,
      payload
    );
    let handler = fetchHandler(pretender, reqKey);

    if (!handler) {
      console.error(`Unexpected request ${reqKey}`); // eslint-disable-line
      throw new Error(`Unexpected request ${reqKey}`);
    }

    return Reflect.apply(handler, this, [req]);
  }

  function specialisedHandler(req) {
    actualCount++;

    if (typeOf(response) === 'function') {
      return response(req);
    } else {
      return response;
    }
  }

  function assertion() {
    assert.equal(actualCount, expectedCount, `Expected ${message} ${key}`);
  }

  // Register our specialised handler in the queue as many
  // times as specified in `count`.
  for (let i = 0; i < expectedCount; i++) {
    storeHandler(pretender, key, specialisedHandler);
  }

  // This is our generic handler. Its job is to pop a specialised
  // handler off the queue or complain if none exists.
  pretender.register(expectedVerb, expectedPath, genericHandler);

  // Whatever happens, we’ll queue up our assertion.
  andThen(assertion);
}

function generateKey(verb, path, headers, query, payload) {
  return JSON.stringify([verb.toUpperCase(), path, headers, query, payload]);
}

function storeHandler(pretender, key, handler) {
  pretender.__handlers__ = pretender.__handlers__ || {};
  pretender.__handlers__[key] = pretender.__handlers__[key] || [];
  pretender.__handlers__[key].push(handler);
}

function fetchHandler(pretender, key) {
  let handlers = pretender.__handlers__[key];
  let handler = handlers && handlers.shift();
  return handler;
}

function sanitizeHeaders(headers, expectedHeaders) {
  let result = copy(headers, false);

  Object.keys(result).forEach((key) => {
    if(!expectedHeaders.hasOwnProperty(key)) {
      delete result[key];
    }
  });

  return result;
}
