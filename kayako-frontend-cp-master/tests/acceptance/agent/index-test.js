import { app } from 'frontend-cp/tests/helpers/qunit';
import { test } from 'qunit';

app('Acceptance | agent/index', {
  beforeEach() {
    const columns = server.createList('column', 5);

    const propositionAssignedToCurrentUser = server.create('proposition', {
      field: 'cases.assigneeagentid',
      operator: 'comparison_equalto',
      value: '(current_user)'
    });

    const inboxPredicateCollection = server.create('predicate-collection', {
      propositions: [{ id: propositionAssignedToCurrentUser.id, resource_type: 'proposition' }]
    });

    this.view = server.create('view', {
      title: 'Inbox',
      is_default: true,
      is_enabled: true,
      is_system: true,
      order_by: 'DESC',
      order_by_column: 'caseid',
      columns: columns,
      predicate_collections: [{ id: inboxPredicateCollection.id, resource_type: 'predicate_collection' }],
      sort_order: 1,
      type: 'INBOX'
    });

    const emails = [
      server.create('identity-email', { email: 'first@example.com', is_primary: true, is_validated: true })
    ];
    const locale = server.create('locale', { locale: 'en-us' });
    const user = server.create('user', { emails, role: server.create('role'), locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user });
    server.create('plan', { limits: {}, features: [], account_id: '123', subscription_id: '123' });

    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('visiting /agent redirects to case list', function(assert) {
  assert.expect(1);

  visit('/agent');

  andThen(() => {
    assert.equal(currentURL(), `/agent/conversations/view/${this.view.id}`);
  });
});
