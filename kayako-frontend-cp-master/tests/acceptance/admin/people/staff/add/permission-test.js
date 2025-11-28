import { app } from 'frontend-cp/tests/helpers/qunit';
import { test } from 'qunit';

app('Acceptance | admin/team-settings/staff/add/permission', {
  beforeEach() {
    server.create('locale', {
      locale: 'en-us',
      isDefault: true
    });

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });

    let adminRole = server.create('role', { type: 'ADMIN' });
    let locale = server.create('locale', { locale: 'en-us' });
    let agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
    let session = server.create('session', { user: agent });
    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('accessing modal via button with "users.update" permission', function(assert) {
  assert.expect(1);

  server.create('permission', { name: 'users.update' });

  visit('/admin/team-settings/agent-directory');

  click('.qa-add-member-button');

  andThen(function() {
    assert.equal(currentURL(), '/admin/team-settings/agent-directory/add', 'We\'re on the correct page');
  });
});

test('accessing modal via button without "users.update" permission', function(assert) {
  assert.expect(1);

  visit('/admin/team-settings/agent-directory');

  andThen(function() {
    assert.equal(find('.qa-add-member-button').length, 0, 'Add member button hidden', 'We don\'t have access to add users');
  });
});

test('navigating directly to modal with "users.update" permission', function(assert) {
  assert.expect(1);

  server.create('permission', { name: 'users.update' });

  visit('/admin/team-settings/agent-directory/add');

  andThen(function() {
    assert.equal(currentURL(), '/admin/team-settings/agent-directory/add', 'We\'re on the correct page');
  });
});

test('navigating directly to modal without "users.update" permission', function(assert) {
  assert.expect(1);

  visit('/admin/team-settings/agent-directory/add');

  andThen(function() {
    assert.equal(currentURL(), '/admin/team-settings/agent-directory', 'We don\'t have access to the add users page');
  });
});
