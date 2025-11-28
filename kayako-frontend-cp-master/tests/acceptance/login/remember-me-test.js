import { test } from 'qunit';
import { app } from 'frontend-cp/tests/helpers/qunit';
import setupDataForCasesView from 'frontend-cp/tests/helpers/login-resources';
import Mirage from 'ember-cli-mirage';
import arrayToObjectWithNumberedKeys from 'frontend-cp/mirage/utils/array-to-object-with-numbered-keys';
import gatherSideloadedResources from 'frontend-cp/mirage/utils/gather-sideloaded-resources';

function gatherResources({ schema, session }) {
  return {
    business_hour: arrayToObjectWithNumberedKeys(schema.db.businessHours),
    field_option: arrayToObjectWithNumberedKeys(schema.db.fieldOptions),
    contact_address: arrayToObjectWithNumberedKeys(schema.db.contactAddresses),
    contact_website: arrayToObjectWithNumberedKeys(schema.db.contactWebsites),
    identity_domain: arrayToObjectWithNumberedKeys(schema.db.identityDomains),
    identity_email: arrayToObjectWithNumberedKeys(schema.db.identityEmails),
    identity_phone: arrayToObjectWithNumberedKeys(schema.db.identityPhones),
    identity_twitter: arrayToObjectWithNumberedKeys(schema.db.identityTwitters),
    identity_facebook: arrayToObjectWithNumberedKeys(schema.db.identityFacebooks),
    locale: arrayToObjectWithNumberedKeys(schema.db.locales),
    organization: arrayToObjectWithNumberedKeys(schema.db.organizations),
    role: arrayToObjectWithNumberedKeys(schema.db.roles),
    team: arrayToObjectWithNumberedKeys(schema.db.teams),
    user: arrayToObjectWithNumberedKeys([schema.db.users.find(session.user.id)]),
    user_field: arrayToObjectWithNumberedKeys(schema.db.userFields)
  };
}

app('Acceptance | login/remember-me', {
  beforeEach() {
    server.create('locale');
  },

  afterEach() {
    logout();
  }
});

test('submitting valid credentials with remember-me=true and checking that a consequent request has the cookies present', async function(assert) {
  withVariation('release-remember-me', true);
  // required data for the subsequent redirect, but not interesting for this test itself
  setupDataForCasesView();

  let session;
  const CSRF_TOKEN = 'a-csrf-token';
  const REMEMBER_ME_TOKEN = 'a-remember-me-token';

  server.get('/api/v1/session', (schema, request) => {
    session = schema.db.sessions[0];
    let rememberMe = request.queryParams.remember_me;

    assert.equal(rememberMe, 'true', 'Remember Me query param is `true`');

    if (request.requestHeaders.Authorization === 'Basic ' + btoa('rememberme@kayako.com:valid')) {
      const user = schema.db.users[0];
      session = server.create('session', { user: { id: user.id, resource_type: 'user' }});
    }

    return new Mirage.Response(200, {
      'X-CSRF-Token': CSRF_TOKEN,
      'X-RememberMe': REMEMBER_ME_TOKEN
    }, {
      status: 200,
      data: session,
      resource: 'session',
      resources: gatherResources({ schema, session })
    });
  });

  // This is representative of literally any other API that we're guaranteed to hit after login.
  server.get('/api/v1/plan', ({ db }, { requestHeaders }) => {
    let data = db.plans.get('lastObject');
    let resources = gatherSideloadedResources(db, data);

    const sessionId = requestHeaders['X-Session-ID'];

    assert.equal(sessionId, session.id, 'Session ID in request headers is the same as the one in the stored session');

    return {
      status: 200,
      resource: 'plan',
      data,
      resources
    };
  });

  await visit('/agent/login');

  await fillIn('.ko-login-password__email', 'rememberme@kayako.com');
  await fillIn('.ko-login-password__password', 'valid');
  await click('.qa-remember-me-tick');
  await click('.ko-login__submit');

  assert.equal(currentURL(), '/agent/conversations/view/1', 'Successful login');

});
