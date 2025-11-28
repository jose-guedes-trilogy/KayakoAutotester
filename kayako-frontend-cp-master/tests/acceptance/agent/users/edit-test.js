import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';


let owner;

app('Acceptance | User | Edit user', {
  beforeEach() {
    server.create('permission', { name: 'agent.users.update' });
    const locale = server.create('locale');
    const brand = server.create('brand', { locale });
    const caseFields = server.createList('case-field', 4);
    const mailbox = server.create('mailbox', { brand });
    server.create('channel', { account: { id: mailbox.id, resource_type: 'mailbox' } });
    server.create('case-form', {
      fields: caseFields,
      brand: brand
    });
    const roles = [
      server.create('role'),
      server.create('role', {title: 'Agent', type: 'AGENT', id: 2}),
      server.create('role', {title: 'Collaborator', type: 'COLLABORATOR', id: 3}),
      server.create('role', {title: 'Customer', type: 'CUSTOMER', id: 4}),
      server.create('role', {title: 'Owner', type: 'OWNER', id: 5})
    ];

    const ownerRole = roles[4];
    owner = server.create('user', {role: ownerRole, locale: locale, agent_case_access: 'ALL', organization_case_access: null, time_zone: 'Europe/London' });

    const agent = server.create('user', { role: ownerRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    login(session.id);

    const feature = server.create('feature', {
      code: 'shared_organizations',
      name: 'shared_organizations',
      description: 'People who may log in as a team member'
    });

    server.create('plan', { limits: { agents: 20 }, features: [feature], account_id: '123', subscription_id: '123' });
  },

  afterEach() {
    logout();
    owner = null;
  }
});

test('editing a customer\'s locale', function(assert) {
  assert.expect(1);

  server.create('locale', {
    id: 4,
    name: 'Deutsch',
    native_name: 'Deutsch',
    locale: 'de'
  });

  server.put(`/api/v1/users/${owner.id}`, (_, { requestBody }) => {
    let body = JSON.parse(requestBody);
    assert.equal(body.locale_id, '4', 'locale_id correctly set in request payload');
  });

  visit(`/agent/users/${owner.id}`);

  selectChoose('.qa-user-content__locale-select', 'Deutsch');

  click('.qa-user-content__submit-properties');
});
