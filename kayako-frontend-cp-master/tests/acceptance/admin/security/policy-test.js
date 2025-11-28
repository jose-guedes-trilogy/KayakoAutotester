import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';
import expectRequest from 'frontend-cp/tests/helpers/expect-request';

app('Acceptance | admin/security/policy', {
  beforeEach() {
    useDefaultScenario();
    login();
  },

  afterEach() {
    logout();
  }
});

test('display settings', function (assert) {
  visit('/admin/security/policy');
  andThen(() => {
    assert.equal(find('.ko-admin-settings-security-session-expiry').val(), '8');
    assert.equal(find('.ko-admin-settings-security-login-attempt-limit').val(), '10');
    assert.equal(find('.ko-admin-settings-security-password-expires-in').val(), '0');
    assert.equal(find('.ko-admin-settings-security-minimum-length').val(), '8');
    assert.equal(find('.ko-admin-settings-security-minimum-numbers').val(), '1');
    assert.equal(find('.ko-admin-settings-security-minimum-symbols').val(), '1');
    assert.ok(find('.ko-admin-settings-security-mixed-case').text().includes('Yes'));
    assert.equal(find('.ko-admin-settings-security-maximum-consecutive').val(), '0');
  });
});

test('display customer settings', function (assert) {
  visit('/admin/security/policy/customers');
  andThen(() => {
    assert.equal(find('.ko-admin-settings-security-session-expiry').val(), '72');
    assert.equal(find('.ko-admin-settings-security-login-attempt-limit').val(), '10');
    assert.equal(find('.ko-admin-settings-security-password-expires-in').val(), '0');
    assert.equal(find('.ko-admin-settings-security-minimum-length').val(), '5');
    assert.equal(find('.ko-admin-settings-security-minimum-numbers').val(), '1');
    assert.equal(find('.ko-admin-settings-security-minimum-symbols').val(), '0');
    assert.ok(find('.ko-admin-settings-security-mixed-case').text().includes('No'));
    assert.equal(find('.ko-admin-settings-security-maximum-consecutive').val(), '0');
  });
});

test('display help center settings', function (assert) {
  visit('/admin/security/policy/help-center');
  andThen(() => {
    assert.ok(find('.ko-admin-settings-security-html_content[aria-checked=true]').length === 1);
  });
});

test('customer field validation errors', function(assert) {
  assert.expect(2);

  let errors = [
    'security.customer.session_expiry',
    'security.customer.login_attempt_limit',
    'security.customer.password.expires_in',
    'security.customer.password.min_characters',
    'security.customer.password.min_numbers',
    'security.customer.password.min_symbols',
    'security.customer.password.require_mixed_case',
    'security.customer.password.max_consecutive'
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

  visit('/admin/security/policy/customers');
  fillIn('.ko-admin-settings-security-session-expiry', '48');
  click('.qa-ko-form_buttons__submit');

  andThen(function() {
    assert.equal(find('.qa-field-error').length, 8, 'Field validation errors displayed on each field');
    assert.equal(find('.qa-field-error:eq(0)').text().trim(), 'The value of the field is invalid', 'Field validation text');
  });
});

test('edit agent settings', function (assert) {
  visit('/admin/security/policy');
  fillIn('.ko-admin-settings-security-session-expiry', '9');
  fillIn('.ko-admin-settings-security-login-attempt-limit', '11');
  fillIn('.ko-admin-settings-security-password-expires-in', '1');
  fillIn('.ko-admin-settings-security-minimum-length', '9');
  fillIn('.ko-admin-settings-security-minimum-numbers', '2');
  fillIn('.ko-admin-settings-security-minimum-symbols', '2');
  selectChoose('.ko-admin-settings-security-mixed-case', 'No');
  fillIn('.ko-admin-settings-security-maximum-consecutive', '1');
  click('.qa-ko-form_buttons__submit');
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
        'security.agent.session_expiry': '9',
        'security.agent.login_attempt_limit': '11',
        'security.agent.password.expires_in': '1',
        'security.agent.password.min_characters': '9',
        'security.agent.password.min_numbers': '2',
        'security.agent.password.min_symbols': '2',
        'security.agent.password.require_mixed_case': '0',
        'security.agent.password.max_consecutive': '1'
      }
    }
  }, assert);
});

test('edit help center settings', function (assert) {
  visit('/admin/security/policy/help-center');
  click('.ko-admin-settings-security-html_content');
  click('.qa-ko-form_buttons__submit');
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
        'security.allow_unsafe_html_in_articles': '0'
      }
    }
  }, assert);
});

test('agent field validation errors', function(assert) {
  assert.expect(2);

  let errors = [
    'security.agent.session_expiry',
    'security.agent.login_attempt_limit',
    'security.agent.password.expires_in',
    'security.agent.password.min_characters',
    'security.agent.password.min_numbers',
    'security.agent.password.min_symbols',
    'security.agent.password.require_mixed_case',
    'security.agent.password.max_consecutive'
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

  visit('/admin/security/policy');
  fillIn('.ko-admin-settings-security-session-expiry', '48');
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

  visit('/admin/security/policy');

  withVariation('release-new-onboarding', true);
  visit('/agent/welcome?trial=true');
  andThen(() => {
    assert.equal(currentURL(), '/agent/welcome');
  });
});
