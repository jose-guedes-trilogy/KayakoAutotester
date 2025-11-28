import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';
import modalStyles from 'frontend-cp/components/ko-modal/styles';
import triggerStyles from 'frontend-cp/components/ko-admin/triggers/index/styles';

app('Acceptance | admin/automation/triggers/index', {
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

test('deleting an enabled trigger field', function(assert) {
  assert.expect(4);

  server.create('trigger', { title: 'test trigger', is_enabled: true, execution_order: 1 });

  visit('/admin/automation/triggers');

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/triggers');
    triggerEvent(`.${rowStyles.row}:contains("test trigger")`, 'mouseenter');
    click(`.${rowStyles.row}:contains("test trigger") a:contains(Delete)`);
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/triggers');
    assert.notOk(find('span:contains("test trigger")').length > 0);
  });
});

test('triggers are ordered by their execution order and then grouped by enabled and disabled', function(assert) {
  assert.expect(6);

  server.create('trigger', { title: 'test trigger 5', is_enabled: false, execution_order: 5 });
  server.create('trigger', { title: 'test trigger 4', is_enabled: true, execution_order: 4 });
  server.create('trigger', { title: 'test trigger 3', is_enabled: true, execution_order: 3 });
  server.create('trigger', { title: 'test trigger 2', is_enabled: true, execution_order: 2 });
  server.create('trigger', { title: 'test trigger 1', is_enabled: false, execution_order: 1 });

  visit('/admin/automation/triggers');

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/triggers');
    assert.equal(find(`.qa-admin_triggers--enabled li:nth-of-type(1) .${triggerStyles.title}`).text().trim(), 'test trigger 2');
    assert.equal(find(`.qa-admin_triggers--enabled li:nth-of-type(2) .${triggerStyles.title}`).text().trim(), 'test trigger 3');
    assert.equal(find(`.qa-admin_triggers--enabled li:nth-of-type(3) .${triggerStyles.title}`).text().trim(), 'test trigger 4');
    assert.equal(find(`.qa-admin_triggers--disabled .${rowStyles.row}:eq(0) .${triggerStyles.title}`).text().trim(), 'test trigger 1');
    assert.equal(find(`.qa-admin_triggers--disabled .${rowStyles.row}:eq(1) .${triggerStyles.title}`).text().trim(), 'test trigger 5');
  });
});
