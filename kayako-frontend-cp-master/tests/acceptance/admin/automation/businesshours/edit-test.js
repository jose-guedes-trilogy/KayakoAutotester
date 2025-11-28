import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';
import gridPickerStyles from 'frontend-cp/components/ko-grid-picker/styles';
import formFieldStyles from 'frontend-cp/components/ko-form/field/styles';

app('Acceptance | admin/team-settings/businesshours Edit', {
  beforeEach() {
    /*eslint-disable camelcase*/
    const locale = server.create('locale', {
      id: 1,
      locale: 'en-us',
      is_public: true
    });
    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    const adminRole = server.create('role', { type: 'ADMIN' });
    const agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    login(session.id);

    server.create('businesshours', {
      title: 'Initial Default',
      isDefault: true,
      zones: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      }
    });
  },

  afterEach() {
    logout();
  }
});

test('select some busines hours by clicking', function(assert) {
  visit('/admin/team-settings/businesshours/1');

  andThen(function() {
    assert.equal(currentURL(), '/admin/team-settings/businesshours/1');
    click(`.${gridPickerStyles.row}:first-child .${gridPickerStyles.cell}:first-child`);
    click(`.${gridPickerStyles.row}:nth-child(2) .${gridPickerStyles.cell}:first-child`);
  });

  andThen(function() {
    assert.equal(find(`.${gridPickerStyles.row} .${gridPickerStyles.selected}`).length, 2);
    click(`.${gridPickerStyles.row}:first-child .${gridPickerStyles.cell}:first-child`);
  });

  andThen(function() {
    assert.equal(find(`.${gridPickerStyles.row} .${gridPickerStyles.selected}`).length, 1);
  });
});

test('Add a holiday', function(assert) {
  visit('/admin/team-settings/businesshours/1');

  andThen(function() {
    assert.equal(currentURL(), '/admin/team-settings/businesshours/1');
    click('.qa-admin_buinesshours_edit__add-holiday');
  });

  andThen(function() {
    fillIn(`.${formFieldStyles.container} input`, 'My Birthday');
  });

  andThen(function() {
    click('.ko-admin_holidays_edit__buttons button:first');
  });

  andThen(function() {
    assert.equal(find('.' + rowStyles.row).length, 1);
  });
});
