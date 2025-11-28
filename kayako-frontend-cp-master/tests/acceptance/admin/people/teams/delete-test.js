import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

app('Acceptance | Admin | People | Teams', {
  beforeEach() {
    const emails = [
      server.create('identity-email', { email: 'first@example.com', is_primary: true, is_validated: true }),
      server.create('identity-email', { email: 'second@example.com', is_primary: false, is_validated: true }),
      server.create('identity-email', { email: 'third@example.com', is_primary: false, is_validated: false })
    ];

    server.create('team', { title: 'Sales', businesshour: server.create('business-hour') });
    server.create('team', { title: 'Finance', businesshour: server.create('business-hour') });

    server.create('permission', { name: 'admin.team.create', value: true });
    server.create('permission', { name: 'admin.team.update', value: true });
    server.create('permission', { name: 'admin.team.update', value: true });
    server.create('permission', { name: 'admin.team.delete', value: true });

    const locale = server.create('locale', { locale: 'en-us' });
    const user = server.create('user', { emails, locale: locale, role: server.create('role', { roleType: 'ADMIN' }), time_zone: 'Europe/London' });
    const session = server.create('session', { user });

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });

    server.create('brand', { locale: server.create('locale') });

    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('Trying to delete a team and cancelling the operation leaves you on the same page', function(assert) {
  assert.expect(3);

  visit('/admin/team-settings/teams');

  andThen(function() {
    assert.equal(find('.qa-teams-row').length, 2);
    triggerEvent('.qa-teams-row:eq(0)', 'hover');
    click('.qa-teams-row:eq(0) a');
  });

  andThen(function() {
    assert.equal(find('.qa-ko-admin_team__input-title').val(), 'Sales');
    click('.qa-ko-form_buttons__delete');
    click('.qa-ko-confirm-modal__cancel');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/team-settings/teams/1');
  });
});
