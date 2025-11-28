import { app, test } from 'frontend-cp/tests/helpers/qunit';

app('Acceptance | User | Change role', {
  beforeEach() {
    server.create('locale');
    server.create('permission', { name: 'agent.users.update' });

    this.roles = {
      admin: server.create('role', { type: 'ADMIN', title: 'Administrator' }),
      agent: server.create('role', { type: 'AGENT', title: 'Agent' }),
      customer: server.create('role', { type: 'CUSTOMER', title: 'Customer' })
    };
  },

  afterEach() {
    logout();
  }
});

test('Declining confirmation prevents the record from saving', function(assert) {
  let me = server.create('user', { role: this.roles.admin, time_zone: 'Europe/London' });
  let other = server.create('user', { role: this.roles.agent, time_zone: 'Europe/London' });
  let session = server.create('session', { user: me });
  let requested = false;
  let endpoint = `/api/v1/users/${other.id}`;

  server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
  login(session.id);

  server.put(endpoint, () => {
    assert.ok(false, `expected NOT to request PUT ${endpoint}`);
  });

  visit(`/agent/users/${other.id}`);
  selectChoose('.ko-user-content__role-field', 'Customer');
  click('.qa-user-content__submit-properties');

  andThen(() => {
    assert.equal(requested, false, `expect NOT to request PUT ${endpoint}`);
  });
});

test('AGENTs may not change another user’s role', function(assert) {
  let me = server.create('user', { role: this.roles.agent, time_zone: 'Europe/London' });
  let other = server.create('user', { role: this.roles.customer, time_zone: 'Europe/London' });
  let session = server.create('session', { user: me });

  server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
  login(session.id);

  visit(`/agent/users/${other.id}`);

  andThen(() => {
    let trigger = find('.ko-user-content__role-field .ember-power-select-trigger');

    assert.ok(
      trigger.is('[aria-disabled="true"]'),
      'expected role field to be disabled'
    );
  });
});
