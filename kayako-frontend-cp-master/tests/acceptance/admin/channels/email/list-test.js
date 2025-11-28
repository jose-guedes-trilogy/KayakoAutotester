import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import {
  getEnabledRows
} from './helpers';

app('Acceptance | admin/channels/email/list', {
  beforeEach() {
    const locale = server.create('locale', { id: 1, locale: 'en-us', isDefault: true });
    const role = server.create('role', { type: 'ADMIN' });
    const user = server.create('user', { role, locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user });

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });

    const brand = server.create('brand', { domain: 'kayako.com', name: 'Main Brand' });
    server.create('mailbox', { address: 'main@kayako.com', brand, is_system: true, is_deleted: false });
    server.create('mailbox', { address: 'support@kayako.com', brand, is_enabled: true, is_default: true, is_deleted: false });
    server.create('mailbox', { address: 'sales@kayako.com', brand, is_enabled: true, is_deleted: false });
    server.create('mailbox', { address: 'jobs@kayako.com', brand, is_enabled: false, is_deleted: false });

    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('opening a mailbox edit page by clicking on the row', function (assert) {
  visit('/admin/channels/email');
  andThen(() => click(getEnabledRows().eq(0)));
  andThen(() => assert.equal(currentURL(), '/admin/channels/email/1'));
});

test('opening a mailbox edit page by clicking on the edit link', function (assert) {
  visit('/admin/channels/email');
  andThen(() => triggerEvent(getEnabledRows().eq(0), 'mouseenter'));
  andThen(() => click(getEnabledRows().eq(0).find('.qa-mailbox-edit')));
  andThen(() => assert.equal(currentURL(), '/admin/channels/email/1'));
});
