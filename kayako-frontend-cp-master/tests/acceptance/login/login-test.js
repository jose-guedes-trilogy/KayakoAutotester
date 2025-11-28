import { test } from 'qunit';
import { app } from 'frontend-cp/tests/helpers/qunit';
import setupDataForCasesView from 'frontend-cp/tests/helpers/login-resources';

app('Acceptance | login/login', {
  beforeEach() {
    server.create('locale');
  },

  afterEach() {
    logout();
  }
});

test('visiting /agent/login', function(assert) {
  visit('/agent/login');

  andThen(function() {
    assert.equal(currentURL(), '/agent/login');
  });
});

test('submitting invalid credentials', function(assert) {
  visit('/agent/login');

  fillIn('.ko-login-password__email', 'invalid@kayako.com');
  fillIn('.ko-login-password__password', 'invalid');
  click('.ko-login__submit');

  andThen(() => {
    assert.equal(currentURL(), '/agent/login');
    assert.equal(find('.qa-login__message').length, 1);
    assert.equal(find('.qa-login__message').text().trim(), 'Email and password combination is incorrect');
  });
});

test('submitting valid credentials', function(assert) {
  // required data for the subsequent redirect, but not interesting for this test itself
  setupDataForCasesView();

  visit('/agent/login');

  fillIn('.ko-login-password__email', 'main@kayako.com');
  fillIn('.ko-login-password__password', 'valid');
  click('.ko-login__submit');

  andThen(() => {
    assert.equal(currentURL(), '/agent/conversations/view/1');
  });
});

test('login form without google sign-in button', function(assert) {
  visit('/agent/login');

  andThen(function() {
    assert.equal(find('.qa-login__google').length, 0);
  });
});

test('login form with google sign-in button', function(assert) {
  server.create('auth-provider', {
    provider_code: 'GIA',
    scheme: 'IDENTITY',
    login_url: 'https://example.kayako.com/login/link/google/agent?action=#action#'
  });

  visit('/agent/login');

  andThen(function() {
    assert.equal(find('.qa-login__google').length, 1);
  });
});

test('submitting valid token', function(assert) {
  let session = this.application.__container__.lookup('service:session');
  session.set('impersonationToken', '456D626572207375636B73');
  // required data for the subsequent redirect, but not interesting for this test itself
  setupDataForCasesView();
  visit('/agent/login');

  andThen(() => {
    assert.equal(currentURL(), '/agent/conversations/view/1');
  });
});
