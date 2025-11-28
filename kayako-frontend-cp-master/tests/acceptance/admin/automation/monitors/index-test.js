import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';
import modalStyles from 'frontend-cp/components/ko-modal/styles';
import monitorsStyles from 'frontend-cp/components/ko-admin/monitors/index/styles';

app('Acceptance | admin/automation/monitors - Index of monitors', {
  beforeEach() {
    const locale = server.create('locale', {
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

test('deleting an enabled monitor', function(assert) {
  assert.expect(4);

  server.create('monitor', { title: 'test monitor', is_enabled: true, execution_order: 1 });

  visit('/admin/automation/monitors');

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors');
    triggerEvent(`.${rowStyles.row}:contains("test monitor")`, 'mouseenter');
    click(`.${rowStyles.row}:contains("test monitor") a:contains(Delete)`);
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors');
    assert.equal(find('span:contains("test monitor")').length, 0);
  });
});

test('deleting a disabled monitor', function(assert) {
  assert.expect(4);

  server.create('monitor', { title: 'test monitor', is_enabled: false, execution_order: 1 });

  visit('/admin/automation/monitors');

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors');
    triggerEvent(`.${rowStyles.row}:contains("test monitor")`, 'mouseenter');
    click(`.${rowStyles.row}:contains("test monitor") a:contains(Delete)`);
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors');
    assert.equal(find('span:contains("test monitor")').length, 0);
  });
});

test('enabled monitors are ordered by their execution order, disabled monitors are ordered by title', function(assert) {
  assert.expect(6);

  server.create('monitor', { title: 'test monitor 5', is_enabled: false, execution_order: 5 });
  server.create('monitor', { title: 'test monitor 4', is_enabled: true, execution_order: 4 });
  server.create('monitor', { title: 'test monitor 3', is_enabled: true, execution_order: 3 });
  server.create('monitor', { title: 'test monitor 2', is_enabled: true, execution_order: 2 });
  server.create('monitor', { title: 'test monitor 1', is_enabled: false, execution_order: 1 });

  visit('/admin/automation/monitors');

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors');
    assert.equal(find(`.qa-admin_monitors--enabled li:nth-of-type(1) .${monitorsStyles.title}`).text().trim(), 'test monitor 2');
    assert.equal(find(`.qa-admin_monitors--enabled li:nth-of-type(2) .${monitorsStyles.title}`).text().trim(), 'test monitor 3');
    assert.equal(find(`.qa-admin_monitors--enabled li:nth-of-type(3) .${monitorsStyles.title}`).text().trim(), 'test monitor 4');
    assert.equal(find(`.qa-admin_monitors--disabled .${rowStyles.row}:eq(0) .${monitorsStyles.title}`).text().trim(), 'test monitor 1');
    assert.equal(find(`.qa-admin_monitors--disabled .${rowStyles.row}:eq(1) .${monitorsStyles.title}`).text().trim(), 'test monitor 5');
  });
});
