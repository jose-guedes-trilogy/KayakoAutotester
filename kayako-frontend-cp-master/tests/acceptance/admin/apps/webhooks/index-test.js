import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import modalStyles from 'frontend-cp/components/ko-modal/styles';

app('Acceptance | admin/integrations/webhooks/index', {
  beforeEach() {
    const locale = server.create('locale', {
      id: 1,
      locale: 'en-us'
    });

    const adminRole = server.create('role', { type: 'ADMIN' });
    const agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    login(session.id);

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
  },

  afterEach() {
    logout();
  }
});

test('deleting an enabled webhook', function(assert) {
  assert.expect(4);

  server.create('token', { label: 'test webhook', is_enabled: true });

  visit('/admin/integrations/webhooks');

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks');
    triggerEvent('.qa-admin_webhooks--enabled .qa-admin_row div:contains("test webhook")', 'mouseenter');
    click('.qa-admin_webhooks--enabled .qa-admin_row div:contains("test webhook") a:contains(Delete)');
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks');
    assert.notOk(find('span:contains("test webhook")').length > 0);
  });
});

test('deleting an disabled webhook', function(assert) {
  assert.expect(4);

  server.create('token', { label: 'test webhook', is_enabled: false });

  visit('/admin/integrations/webhooks');

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks');
    triggerEvent('.qa-admin_webhooks--disabled .qa-admin_row div:contains("test webhook")', 'mouseenter');
    click('.qa-admin_webhooks--disabled .qa-admin_row div:contains("test webhook") a:contains(Delete)');
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks');
    assert.notOk(find('span:contains("test webhook")').length > 0);
  });
});

test('webhooks are ordered by their title and then grouped by enabled and disabled', function(assert) {
  assert.expect(6);

  server.create('token', { label: 'test webhook 5', is_enabled: false });
  server.create('token', { label: 'test webhook 4', is_enabled: true });
  server.create('token', { label: 'test webhook 3', is_enabled: true });
  server.create('token', { label: 'test webhook 2', is_enabled: true });
  server.create('token', { label: 'test webhook 1', is_enabled: false });

  visit('/admin/integrations/webhooks');

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks');
    assert.equal(find('.qa-admin_webhooks--enabled .qa-admin_row:nth-of-type(1) .qa-admin_row_label').text().trim(), 'test webhook 2');
    assert.equal(find('.qa-admin_webhooks--enabled .qa-admin_row:nth-of-type(2) .qa-admin_row_label').text().trim(), 'test webhook 3');
    assert.equal(find('.qa-admin_webhooks--enabled .qa-admin_row:nth-of-type(3) .qa-admin_row_label').text().trim(), 'test webhook 4');
    assert.equal(find('.qa-admin_webhooks--disabled .qa-admin_row:nth-of-type(1) .qa-admin_row_label').text().trim(), 'test webhook 1');
    assert.equal(find('.qa-admin_webhooks--disabled .qa-admin_row:nth-of-type(2) .qa-admin_row_label').text().trim(), 'test webhook 5');
  });
});
