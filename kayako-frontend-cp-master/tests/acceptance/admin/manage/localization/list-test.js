import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';

export const getEnabledRows = () => find(`.qa-languages-enabled .${rowStyles.row}`);
export const getDisabledRows = () => find(`.qa-languages-disabled .${rowStyles.row}`);

export const assertRow = (assert, row, [name, options = []]) => {
  assert.ok(row.text().indexOf(name) !== -1, 'Language name');

  const isLocalized = options.indexOf('isLocalized') !== -1;
  const isDefault = options.indexOf('isDefault') !== -1;
  assert[isLocalized ? 'ok' : 'notOk'](row.text().indexOf('(Officially supported)') !== -1, name + ' (Officially supported)');
  assert[isDefault ? 'ok' : 'notOk'](row.text().indexOf('(Default)') !== -1, name + ' (Default)');

  triggerEvent(row, 'mouseenter');
  andThen(() => {
    const canDisable = options.indexOf('canDisable') !== -1;
    assert[canDisable ? 'ok' : 'notOk'](row.text().indexOf('Disable') !== -1, name + ' Can be disabled');

    const canEnable = options.indexOf('canEnable') !== -1;
    assert[canEnable ? 'ok' : 'notOk'](row.text().indexOf('Enable') !== -1, name + ' Can be enabled');
  });
  triggerEvent(row, 'mouseleave');
};

export const assertRows = (assert, enabled = [], disabled = []) => {
  const enabledRows = getEnabledRows();
  const disabledRows = getDisabledRows();
  assert.equal(enabledRows.length, enabled.length, 'Enabled language count');
  assert.equal(disabledRows.length, disabled.length, 'Disabled language count');

  enabled.forEach((row, index) => assertRow(assert, enabledRows.eq(index), row));
  disabled.forEach((row, index) => assertRow(assert, disabledRows.eq(index), row));
};

app('Acceptance | admin/customizations/localization', {
  beforeEach() {
    const en = server.create('locale', { id: 1, locale: 'en-us', name: 'English', native_name: 'English', is_public: true, is_localized: true });
    server.create('locale', { id: 2, locale: 'fr-fr', name: 'French', native_name: 'French', is_public: true, is_localized: false });
    server.create('locale', { id: 3, locale: 'de-de', name: 'German', native_name: 'German', is_public: false, is_localized: false });
    server.create('locale', { id: 4, locale: 'ru-ru', name: 'Russian', native_name: 'Russian', is_public: false, is_localized: false });
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

test('listing index', function (assert) {
  visit('/admin/customizations/localization');
  andThen(() => {
    assertRows(assert, [
      ['English', ['isLocalized', 'canDisable', 'isDefault']],
      ['French', ['canDisable']]
    ], [
      ['German', ['canEnable']],
      ['Russian', ['canEnable']]
    ]);
  });
});
