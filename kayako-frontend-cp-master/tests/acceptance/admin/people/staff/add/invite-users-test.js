import { app } from 'frontend-cp/tests/helpers/qunit';
import { test } from 'qunit';
import roleTypes from 'frontend-cp/lib/role-types';
import { clickTrigger } from 'frontend-cp/tests/helpers/ember-power-select';
import fieldErrorStyles from 'frontend-cp/components/ko-form/field/errors/styles';

var owner, admin;

app('Acceptance | admin/team-settings/staff/add/invite users', {
  beforeEach() {
    server.create('locale', {
      locale: 'en-us',
      isDefault: true
    });

    let businesshour = server.create('business-hour', { title: 'Default Business Hours' });
    server.createList('team', 4, { businesshour });

    Object.keys(roleTypes).forEach(function(type) {
      server.create('role', { title: type.toLowerCase().capitalize(), rank: roleTypes[type].rank, type });
    });

    let ownerRole = server.db.roles.where({type: 'OWNER'})[0];
    let adminRole = server.db.roles.where({type: 'ADMIN'})[0];

    server.create('permission', { name: 'users.update' });
    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });

    let locale = server.create('locale', { locale: 'en-us' });
    owner = server.create('user', { role: ownerRole, locale: locale, time_zone: 'Europe/London' });
    admin = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
  },

  afterEach() {
    logout();
  }
});

test('field validation errors', function(assert) {
  assert.expect(4);
  let session = server.create('session', { user: owner });
  login(session.id);

  visit('/admin/team-settings/agent-directory/add');

  click('.qa-modal-save');

  andThen(function() {
    [
      `.qa-fullname .${fieldErrorStyles.error}`,
      `.qa-email .${fieldErrorStyles.error}`,
      `.qa-role .${fieldErrorStyles.error}`,
      `.qa-teams .${fieldErrorStyles.error}`
    ].forEach(function(selector) {
      assert.equal(find(selector).text(), 'The value of the field cannot be empty', 'Field error');
    });
  });
});

test('OWNER can set the correct roles', function(assert) {
  assert.expect(2);

  let session = server.create('session', { user: owner });
  login(session.id);

  visit('/admin/team-settings/agent-directory/add');

  andThen(function() {
    clickTrigger('.qa-role');
  });

  andThen(function() {
    assert.equal(find('.ember-power-select-option').length, 4, 'Correct number of available roles');
    assert.deepEqual(find('.ember-power-select-option').toArray().map(el => $(el).text().trim()), ['Admin', 'Agent', 'Collaborator', 'Owner'], 'Correct available roles');
  });
});

test('ADMIN can set the correct roles', function(assert) {
  assert.expect(2);

  let session = server.create('session', { user: admin });
  login(session.id);

  visit('/admin/team-settings/agent-directory/add');

  click('.qa-add-recipient');

  andThen(function() {
    clickTrigger('.qa-role');
  });

  andThen(function() {
    assert.equal(find('.ember-power-select-option').length, 3, 'Correct number of available roles');
    assert.deepEqual(find('.ember-power-select-option').toArray().map(el => $(el).text().trim()), ['Admin', 'Agent', 'Collaborator'], 'Correct available roles');
  });
});

test('inviting users', function(assert) {
  let session = server.create('session', { user: admin });
  login(session.id);

  visit('/admin/team-settings/agent-directory/add');

  fillIn('.qa-recipient-row-0 .qa-fullname input', 'Foo');
  fillIn('.qa-recipient-row-0 .qa-email input', 'f@foo.com');
  selectChoose('.qa-recipient-row-0 .qa-role', 'Agent');
  selectChoose('.qa-recipient-row-0 .qa-teams', 'Support');
  selectChoose('.qa-recipient-row-0 .qa-teams', 'Finance');

  click('.qa-add-recipient');

  fillIn('.qa-recipient-row-1 .qa-fullname input', 'Bar');
  fillIn('.qa-recipient-row-1 .qa-email input', 'b@bar.com');
  selectChoose('.qa-recipient-row-1 .qa-role', 'Admin');
  selectChoose('.qa-recipient-row-1 .qa-teams', 'Sales');

  click('.qa-modal-save');

  andThen(function() {
    assert.equal(currentURL(), '/admin/team-settings/agent-directory', 'Returned to the user directory');
  });
});
