import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';
import expectRequest from 'frontend-cp/tests/helpers/expect-request';

app('Acceptance | admin/security/authentication', {
  beforeEach() {
    useDefaultScenario();
    login();
  },

  afterEach() {
    logout();
  }
});

test('display settings', function (assert) {
  setupPlanWithGoogleApps();
  visit('/admin/security/authentication');
  andThen(() => {
    assert.ok(find('.ko-admin-settings-security-authentication').text().includes('Standard Kayako login'));
    assert.ok(find('.ko-admin-settings-security-google-login[aria-checked=true]').length === 0);
    assert.equal(find('.ko-admin-settings-security-ip-restrictions').val(), '');
  });
});

test('toggle agent authentication dropdown', function (assert) {
  visit('/admin/security/authentication');
  andThen(() => {
    assert.equal(find('.ko-admin-settings-security-login-url').length, 0);
    assert.equal(find('.ko-admin-settings-security-logout-url').length, 0);
    assert.equal(find('.ko-admin-settings-security-shared-secret').length, 0);
    assert.equal(find('.ko-admin-settings-security-service-name').length, 0);
    selectChoose('.ko-admin-settings-security-authentication', 'Single sign-on (JWT)');
  });
  andThen(() => {
    assert.equal(find('.ko-admin-settings-security-login-url').val(), 'login url');
    assert.equal(find('.ko-admin-settings-security-logout-url').val(), 'logout url');
    assert.equal(find('.ko-admin-settings-security-shared-secret').val(), 'shared secret');
    assert.equal(find('.ko-admin-settings-security-service-name').val(), 'Agent SSO service');
  });
});

test('toggle google authentication checkbox', function (assert) {
  setupPlanWithGoogleApps();
  visit('/admin/security/authentication');
  andThen(() => {
    assert.equal(find('.ko-admin-settings-security-google-domain').length, 0);
    click('.ko-admin-settings-security-google-login');
  });
  andThen(() => {
    assert.equal(find('.ko-admin-settings-security-google-domain .ember-power-select-multiple-option span').text(), '@kayako.com');
  });
});

test('display customer settings', function (assert) {
  visit('/admin/security/authentication/customers');
  andThen(() => {
    assert.ok(find('.ko-admin-settings-security-authentication').text().includes('Standard Kayako login'));
    assert.ok(find('.ko-admin-settings-security-twitter-login[aria-checked=true]').length === 1);
    assert.ok(find('.ko-admin-settings-security-facebook-login[aria-checked=true]').length === 1);
    assert.ok(find('.ko-admin-settings-security-google-login[aria-checked=true]').length === 1);
  });
});

test('toggle customer authentication dropdown', function (assert) {
  visit('/admin/security/authentication/customers');
  andThen(() => {
    assert.equal(find('.ko-admin-settings-security-login-url').length, 0);
    assert.equal(find('.ko-admin-settings-security-logout-url').length, 0);
    assert.equal(find('.ko-admin-settings-security-shared-secret').length, 0);
    assert.equal(find('.ko-admin-settings-security-service-name').length, 0);
    selectChoose('.ko-admin-settings-security-authentication', 'Single sign-on (JWT)');
  });
  andThen(() => {
    assert.equal(find('.ko-admin-settings-security-login-url').val(), 'customer login url');
    assert.equal(find('.ko-admin-settings-security-logout-url').val(), 'customer logout url');
    assert.equal(find('.ko-admin-settings-security-shared-secret').val(), 'customer shared secret');
    assert.equal(find('.ko-admin-settings-security-service-name').val(), 'Customer SSO service');
  });
});

test('customer field validation errors', function(assert) {
  assert.expect(2);

  let errors = [
    'security.customer.authentication_type',
    'security.customer.social_authentication.twitter',
    'security.customer.social_authentication.facebook',
    'security.customer.social_authentication.google',
    'security.customer.sso.jwt.login_url',
    'security.customer.sso.jwt.logout_url',
    'security.customer.sso.jwt.shared_secret',
    'security.customer.sso.jwt.service_name'
  ].map(key => {
    return {
      code: 'FIELD_INVALID',
      parameter: 'values',
      pointer: `/values/${key}`,
      message: 'The value of the field is invalid',
      more_info: 'http://wiki.kayako.com/display/DEV/REST+v1+-+FIELD_INVALID'
    };
  });

  server.put('/api/v1/settings', {
    status: 400,
    errors: errors
  }, 400);

  visit('/admin/security/authentication/customers');
  selectChoose('.ko-admin-settings-security-authentication', 'Single sign-on (JWT)');
  click('.qa-ko-form_buttons__submit');

  andThen(function() {
    assert.equal(find('.qa-field-error').length, 8, 'Field validation errors displayed on each field');
    assert.equal(find('.qa-field-error:eq(0)').text().trim(), 'The value of the field is invalid', 'Field validation text');
  });
});

test('edit agent settings', function (assert) {
  setupPlanWithGoogleApps();
  visit('/admin/security/authentication');
  andThen(() => {
    selectChoose('.ko-admin-settings-security-authentication', 'Single sign-on (JWT)');
    click('.ko-admin-settings-security-google-login');
  });
  andThen(() => {
    click('.ko-admin-settings-security-google-domain .ember-power-select-multiple-option .ember-power-select-multiple-remove-btn');
    fillIn('.ko-admin-settings-security-google-domain input', '@example.com');
    triggerEvent('.ko-admin-settings-security-google-domain input', 'blur');
    fillIn('.ko-admin-settings-security-login-url', 'http://example.com');
    fillIn('.ko-admin-settings-security-logout-url', 'http://example.com/logout');
    fillIn('.ko-admin-settings-security-shared-secret', 'new shared secter');
    fillIn('.ko-admin-settings-security-service-name', 'Company website');
    fillIn('.ko-admin-settings-security-ip-restrictions', '192.168.0.1');
    click('.qa-ko-form_buttons__submit');
  });
  expectRequest(server.pretender, {
    verb: 'PUT',
    path: '/api/v1/settings',
    query: {
      include: '*'
    },
    headers: {
      'X-Options': 'flat',
      'X-CSRF-Token': 'a-csrf-token',
      'X-Session-ID': 'pPW6tnOyJG6TmWCVea175d1bfc5dbf073a89ffeb6a2a198c61aae941Aqc7ahmzw8a'
    },
    payload: {
      values: {
        'security.agent.authentication_type': 'jwt',
        'security.agent.social_authentication.google': '1',
        'security.agent.google.authentication.domain': '@example.com',
        'security.agent.sso.jwt.login_url': 'http://example.com',
        'security.agent.sso.jwt.logout_url': 'http://example.com/logout',
        'security.agent.sso.jwt.shared_secret': 'new shared secter',
        'security.agent.sso.jwt.service_name': 'Company website',
        'security.agent.ip_restriction': '192.168.0.1'
      }
    }
  }, assert);
});

test('agent field validation errors', function(assert) {
  assert.expect(2);

  let errors = [
    'security.agent.authentication_type',
    'security.agent.social_authentication.google',
    'security.agent.google.authentication.domain',
    'security.agent.sso.jwt.login_url',
    'security.agent.sso.jwt.logout_url',
    'security.agent.sso.jwt.shared_secret',
    'security.agent.sso.jwt.service_name',
    'security.agent.ip_restriction'
  ].map(key => {
    return {
      code: 'FIELD_INVALID',
      parameter: 'values',
      pointer: `/values/${key}`,
      message: 'The value of the field is invalid',
      more_info: 'http://wiki.kayako.com/display/DEV/REST+v1+-+FIELD_INVALID'
    };
  });

  server.put('/api/v1/settings', {
    status: 400,
    errors: errors
  }, 400);

  setupPlanWithGoogleApps();
  visit('/admin/security/authentication');
  selectChoose('.ko-admin-settings-security-authentication', 'Single sign-on (JWT)');
  click('.ko-admin-settings-security-google-login');
  click('.qa-ko-form_buttons__submit');

  andThen(function() {
    assert.equal(find('.qa-field-error').length, 8, 'Field validation errors displayed on each field');
    assert.equal(find('.qa-field-error:eq(0)').text().trim(), 'The value of the field is invalid', 'Field validation text');
  });
});

test('leaving the route', function(assert) {
  let user = server.db.sessions[0].user;
  let role = server.db.roles.where({ type: 'ADMIN' })[0];

  server.db.users.update(user.id, { role: { id: role.id, resource_type: 'role' } });

  visit('/admin/security/authentication');

  withVariation('release-new-onboarding', true);
  visit('/agent/welcome?trial=true');
  andThen(() => {
    assert.equal(currentURL(), '/agent/welcome');
  });
});

function setupPlanWithGoogleApps() {
  let googleFeature = server.create('feature', { code: 'sso_team_google_apps' });
  server.create('plan', { limits: { agents: 20 }, features: [googleFeature], account_id: '123', subscription_id: '123' });
}
