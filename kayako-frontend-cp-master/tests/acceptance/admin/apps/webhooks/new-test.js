import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';
import modalStyles from 'frontend-cp/components/ko-modal/styles';

app('Acceptance | admin/integrations/webhooks/new', {
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

test('Creating a webhook', function(assert) {
  assert.expect(8);

  visit('/admin/integrations/webhooks/new');

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks/new');

    fillIn('input[name="label"]', 'Sample webhook label');
    fillIn('input[name="description"]', 'Sample webhook description');

    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks/1');
    assert.equal(find('input[name="label"]').val(), 'Sample webhook label');
    assert.equal(find('input[name="description"]').val(), 'Sample webhook description');
    assert.equal(find('input[name="token"]').val(), 'abc');
    click('.qa-ko-form_buttons__cancel');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks');
    assert.ok(find('.qa-admin_webhooks--enabled').length === 1);
    assert.ok(find('.qa-admin_webhooks--disabled').length === 0);
  });
});

test('Exit having pending changes ask for confirmation', function(assert) {
  assert.expect(3);

  visit('/admin/integrations/webhooks/new');

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks/new');

    fillIn('input[name="label"]', 'Sample webhook label');
    fillIn('input[name="description"]', 'Sample webhook title');

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

  visit('/admin/integrations/webhooks/new');

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks/new');
    click('.qa-ko-form_buttons__cancel');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/integrations/webhooks');
    assert.ok(find('.qa-admin_webhooks--enabled').length === 0, 'The are no enabled webhooks');
    assert.ok(find('.qa-admin_webhooks--disabled').length === 0, 'There are no disabled webhooks');
  });
});
