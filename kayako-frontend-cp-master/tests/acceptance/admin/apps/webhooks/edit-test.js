import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';
import modalStyles from 'frontend-cp/components/ko-modal/styles';

let webhook;

app('Acceptance | admin/integrations/webhooks/edit', {
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

    webhook = server.create('token', {
      label: 'test webhook label',
      description: 'test webhook description',
      token: 'abc',
      is_enabled: true
    });

  },

  afterEach() {
    logout();
  }
});

test('Edit an existing webhook', function(assert) {
  assert.expect(11);

  visit(`/admin/integrations/webhooks/${webhook.id}`);

  andThen(function() {
    assert.equal(currentURL(), `/admin/integrations/webhooks/${webhook.id}`);
    assert.equal(find('input[name="label"]').val(), 'test webhook label');
    assert.equal(find('input[name="description"]').val(), 'test webhook description');
    assert.equal(find('input[name="token"]').val(), 'abc');
    fillIn('input[name="label"]', 'Sample webhook label');
    fillIn('input[name="description"]', 'Sample webhook description');
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks');
    assert.ok(find('.qa-admin_webhooks--enabled').length === 1, 'The webhook is still enabled');
    assert.ok(find('.qa-admin_webhooks--disabled').length === 0, 'There are no disabled webhooks');
    click('.qa-admin_webhooks--enabled .qa-admin_row div:contains("Sample webhook label")');
  });

  andThen(function() {
    assert.equal(currentURL(), `/admin/integrations/webhooks/${webhook.id}`);
    assert.equal(find('input[name="label"]').val(), 'Sample webhook label');
    assert.equal(find('input[name="description"]').val(), 'Sample webhook description');
    assert.equal(find('input[name="token"]').val(), 'abc');
  });
});

test('Exit having pending changes ask for confirmation', function(assert) {
  assert.expect(3);

  visit(`/admin/integrations/webhooks/${webhook.id}`);

  andThen(function() {
    assert.equal(currentURL(), `/admin/integrations/webhooks/${webhook.id}`);
    fillIn('input[name="label"]', 'Sample webhook label');
    click('.qa-ko-form_buttons__cancel');
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks');
  });
});


test('Exit without having pending changes doesn\'t ask for confirmation', function(assert) {
  assert.expect(4);

  visit(`/admin/integrations/webhooks/${webhook.id}`);

  andThen(function() {
    assert.equal(currentURL(), `/admin/integrations/webhooks/${webhook.id}`);
    click('.qa-ko-form_buttons__cancel');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks');
    assert.ok(find('.qa-admin_webhooks--enabled').length === 1, 'The webhook is still enabled');
    assert.ok(find('.qa-admin_webhooks--disabled').length === 0, 'There are no disabled webhooks');
  });
});
