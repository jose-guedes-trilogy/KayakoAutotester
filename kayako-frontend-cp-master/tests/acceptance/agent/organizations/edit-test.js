/* eslint-disable camelcase, new-cap */
import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

let theCase;

import infoBarItemStyles from 'frontend-cp/components/ko-info-bar/item/styles';
import {
  createUserFields,
  createUserFieldValues
} from 'frontend-cp/mirage/scenarios/user-fields';

app('Acceptance | Organization | Update organization', {
  beforeEach() {
    let locale = server.create('locale', {
      id: 1,
      locale: 'en-us'
    });
    let brand = server.create('brand', { locale });
    let statuses = server.createList('case-status', 5);
    let priority = server.create('case-priority');
    let businesshour = server.create('business-hour', { title: 'Default Business Hours' });
    let teams = server.createList('team', 4, { businesshour });
    let customFields = createUserFields(server);
    let agentRole = server.create('role', { title: 'Agent', type: 'AGENT', id: 2 });
    let customerRole = server.create('role', { title: 'Agent', type: 'CUSTOMER', id: 4 });
    let organization = server.create('organization', {
      domains: [server.create('identity-domain')]
    });
    server.create('organization', {
      domains: [server.create('identity-domain')]
    }); // Another organization

    let inboxPredicateCollection = server.create('predicate-collection', {
      propositions: [
        {
          id: server.create('proposition', { field: 'cases.assigneeagentid', operator: 'comparison_equalto', value: '(current_user)'}).id,
          resource_type: 'proposition'
        }
      ]
    });

    server.create('view', {
      title: 'Inbox',
      is_default: true,
      is_enabled: true,
      is_system: true,
      order_by: 'DESC',
      order_by_column: 'caseid',
      columns: server.createList('column', 5),
      predicate_collections: [{ id: inboxPredicateCollection.id, resource_type: 'predicate_collection' }],
      sort_order: 1,
      type: 'INBOX'
    });

    let customer = server.create('user', {
      custom_fields: createUserFieldValues(server, customFields),
      role: customerRole,
      locale,
      organization,
      time_zone: 'Europe/London'
    });

    let agent = server.create('user', {
      custom_fields: createUserFieldValues(server, customFields),
      role: agentRole,
      teams,
      locale,
      time_zone: 'Europe/London'
    });

    theCase = server.create('case', {
      requester: customer,
      creator: agent,
      assignedAgent: { id: agent.id, resource_type: 'user' },
      assignedTeam: { id: teams[0].id, resource_type: 'team' },
      brand,
      source_channel: null,
      identity: null,
      status: statuses[0],
      priority,
      sla_version: server.create('sla-version'),
      sla_metrics: server.createList('sla-metric', 3),
      tags: server.createList('tag', 2)
    });

    [
      'admin.organizations.update',
      'admin.organizations.delete'
    ].forEach(name => server.create('permission', { name }));

    let session = server.create('session', { user: agent });
    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('Update an organization with invalid info highlights the errors', function(assert) {
  visit(`/agent/conversations/${theCase.id}/organization`);

  andThen(function() {
    click('.organization-domains-field .ember-power-select-multiple-remove-btn');
    fillIn('.organization-domains-field input', 'brew2.com');
    keyEvent('.organization-domains-field input', 'keydown', 13);
    click('.qa-organization-content__submit-properties');
  });

  andThen(function() {
    assert.equal(find(`.organization-domains-field .${infoBarItemStyles.containerError}`).length, 1, 'The domains field is marked as errored');
  });
});

test('Update properties button is hidden by default', async function(assert) {
  await visit(`/agent/conversations/${theCase.id}/organization`);

  assert.equal(find('.qa-organization-content__submit-properties').length, 0, 'The update properties button is hidden');
});
