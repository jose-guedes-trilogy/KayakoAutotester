import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';
import expectRequest from 'frontend-cp/tests/helpers/expect-request';

app('Acceptance | admin/security/settings', {
  beforeEach() {
    useDefaultScenario();
    login();
  },

  afterEach() {
    logout();
  }
});

test('display settings', function (assert) {
  visit('/admin/security/settings');
  andThen(() => {
    assert.ok(find('.ko-admin-settings-users-allow-from-unregistered[aria-checked=true]').length === 1);
    assert.ok(find('.ko-admin-settings-users-require-captcha[aria-checked=true]').length === 1);
    assert.equal(find('.ko-admin-settings-users-email-whitelist').val().trim(), 'email whitelist');
    assert.equal(find('.ko-admin-settings-users-email-blacklist').val().trim(), 'email blacklist');
  });
});

test('edit settings', function (assert) {
  visit('/admin/security/settings');
  click('.ko-admin-settings-users-allow-from-unregistered');
  click('.ko-admin-settings-users-require-captcha');
  fillIn('.ko-admin-settings-users-email-whitelist', 'whitelist');
  fillIn('.ko-admin-settings-users-email-blacklist', 'blacklist');
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
        'users.allow_requests_from_unregistered': '0',
        'users.require_captcha': '0',
        'users.email_whitelist': 'whitelist',
        'users.email_blacklist': 'blacklist'
      }
    }
  }, assert);
});

test('field validation errors', function(assert) {
  assert.expect(2);

  let errors = [
    'users.allow_requests_from_unregistered',
    'users.require_captcha',
    'users.email_whitelist',
    'users.email_blacklist'
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

  visit('/admin/security/settings');
  fillIn('.ko-admin-settings-users-email-whitelist', 'xxx');
  click('.qa-ko-form_buttons__submit');

  andThen(function() {
    assert.equal(find('.qa-field-error').length, 4, 'Field validation errors displayed on each field');
    assert.equal(find('.qa-field-error:eq(0)').text().trim(), 'The value of the field is invalid', 'Field validation text');
  });
});

test('leaving the route', function(assert) {
  let user = server.db.sessions[0].user;
  let role = server.db.roles.where({ type: 'ADMIN' })[0];

  server.db.users.update(user.id, { role: { id: role.id, resource_type: 'role' } });

  visit('/admin/security/settings');
  visit('/agent/welcome?trial=true');
  andThen(() => {
    assert.equal(currentURL(), '/agent/welcome');
  });
});
