import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import {
  getEnabledRows,
  assertRows
} from './helpers';
import modalStyles from 'frontend-cp/components/ko-modal/styles';

app('Acceptance | admin/customizations/brands', {
  beforeEach() {
    const en = server.create('locale', { id: 1, locale: 'en-us', name: 'English', is_public: true, is_localized: true });

    server.create('brand', { id: 1, locale: en, is_enabled: true, name: 'Default', domain: 'kayako.com', sub_domain: 'support', is_default: true });
    server.create('brand', { id: 2, locale: en, is_enabled: true, name: 'Custom Alias', domain: 'kayako.com', sub_domain: 'custom_alais', is_default: false, alias: 'example.com' });
    server.create('brand', { id: 3, locale: en, is_enabled: false, name: 'Disabled', domain: 'kayako.com', sub_domain: 'disabled', is_default: false });

    const role = server.create('role', { type: 'ADMIN' });
    const user = server.create('user', { role, locale: en, time_zone: 'Europe/London' });
    const session = server.create('session', { user });

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });

    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('listing brands', function (assert) {
  visit('/admin/customizations/brands');
  andThen(() => {
    assertRows(assert, [
      ['Custom Alias', 'example.com', ['canEdit', 'canDisable', 'canMakeDefault', 'canDelete']],
      ['Default', 'support.kayako.com', ['isDefault', 'canEdit']]
    ], [
      ['Disabled', 'disabled.kayako.com', ['canEdit', 'canEnable', 'canDelete']]
    ]);
  });
});

test('deleting a brand', function (assert) {
  visit('/admin/customizations/brands');
  andThen(() => triggerEvent(getEnabledRows().eq(1), 'mouseenter'));
  andThen(() => {
    click(getEnabledRows().eq(0).find('.qa-brand-delete'));
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(() => {
    assertRows(assert, [
      ['Default', 'support.kayako.com', ['isDefault', 'canEdit']]
    ], [
      ['Disabled', 'disabled.kayako.com', ['canEdit', 'canEnable', 'canDelete']]
    ]);
  });
});


test('making a brand default', function (assert) {
  visit('/admin/customizations/brands');
  andThen(() => triggerEvent(getEnabledRows().eq(1), 'mouseenter'));
  andThen(() => click(getEnabledRows().eq(0).find('.qa-brand-make-default')));
  andThen(() => {
    assertRows(assert, [
      ['Custom Alias', 'example.com', ['isDefault', 'canEdit']],
      ['Default', 'support.kayako.com', ['canEdit', 'canDisable', 'canMakeDefault', 'canDelete']]
    ], [
      ['Disabled', 'disabled.kayako.com', ['canEdit', 'canEnable', 'canDelete']]
    ]);
  });
});

test('opening a brand edit page by clicking on the row', function (assert) {
  visit('/admin/customizations/brands');
  andThen(() => click(getEnabledRows().eq(0)));
  andThen(() => assert.equal(currentURL(), '/admin/customizations/brands/2'));
});

test('opening a brand edit page by clicking on the edit link', function (assert) {
  visit('/admin/customizations/brands');
  andThen(() => triggerEvent(getEnabledRows().eq(0), 'mouseenter'));
  andThen(() => click(getEnabledRows().eq(0).find('.qa-brand-edit')));
  andThen(() => assert.equal(currentURL(), '/admin/customizations/brands/2'));
});
