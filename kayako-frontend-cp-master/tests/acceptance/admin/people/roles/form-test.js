import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';

const createNewCaseCheckboxClass = 'qa-ko-admin_roles-create-public-reply-checkbox';
const createNewUsersCheckboxClass = 'qa-ko-admin_roles-create-new-users-checkbox';
const manageHelpcenterCheckboxClass = 'qa-ko-admin_roles-manage-helpcenter-checkbox';

app('Acceptance | admin/team-settings/roles form', {
  beforeEach() {
    server.create('locale', {
      locale: 'en-us',
      isDefault: true
    });

    let rolesAndPermissionsFeature = server.create('feature', { code: 'custom_roles_and_permissions' });

    server.create('plan', { limits: { agents: 20 }, features: [rolesAndPermissionsFeature], account_id: '123', subscription_id: '123' });

    server.create('role', {
      id: 6,
      type: 'COLLABORATOR',
      title: 'Existing Role',
      is_system: false
    });

    const adminRole = server.create('role', { type: 'ADMIN' });
    const locale = server.create('locale', { locale: 'en-us' });
    const agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('editing a role', function(assert) {
  server.create('permission', { name: 'case.create' });
  server.create('permission', { name: 'chat.observe' });
  server.create('permission', { name: 'chat.transfer' });
  server.create('permission', { name: 'chat.manage' });
  server.create('permission', { name: 'user.create' });
  server.create('permission', { name: 'organization.create' });
  server.create('permission', { name: 'help_center.manage' });

  visit('/admin/team-settings/roles');
  triggerEvent(`.${rowStyles.row}:contains("Existing Role")`, 'mouseenter');
  click('.qa-ko-admin_roles__list-item:contains("Existing Role") .qa-ko-admin_roles_list-item__edit');

  fillIn('input.ko-admin_roles_form__title', 'Edited Role');
  selectChoose('.qa-ko-admin_roles_form__agent-case-access-type', 'Assigned to agent');
  click(`.${createNewCaseCheckboxClass}`);
  click(`.${createNewUsersCheckboxClass}`);
  click(`.${manageHelpcenterCheckboxClass}`);

  andThen(function() {
    assert.equal(find('.ko-admin-form-group__legend:contains("User administration")').length, 0);
    assert.equal(find('.ko-admin-form-group__legend:contains("System administration")').length, 0);
  });

  click('button:contains("Save")');
  triggerEvent(`.${rowStyles.row}:contains("Edited Role")`, 'mouseenter');
  click('.qa-ko-admin_roles__list-item:contains("Edited Role") .qa-ko-admin_roles_list-item__edit');


  andThen(function() {
    findWithAssert(`.${createNewCaseCheckboxClass}[aria-checked=true]`);
    findWithAssert(`.${createNewUsersCheckboxClass}[aria-checked=true]`);
    findWithAssert(`.${manageHelpcenterCheckboxClass}[aria-checked=true]`);
  });
});
