/* eslint-disable camelcase */
import $ from 'jquery';
import { app, test } from 'frontend-cp/tests/helpers/qunit';

import checkboxStyles from 'frontend-cp/components/ko-checkbox/styles';
import modalStyles from 'frontend-cp/components/ko-modal/styles';
import bulkSidebarStyles from 'frontend-cp/components/ko-bulk-sidebar/styles';
import {
  createUserFields,
  createUserFieldValues
} from 'frontend-cp/mirage/scenarios/user-fields';

app('Acceptance | Conversation | List', {
  beforeEach() {
    const enUsLocale = server.create('locale', {
      locale: 'en-us'
    });
    server.create('permission', { name: 'agent.cases.public_reply' });
    server.create('permission', { name: 'agent.cases.trash' });
    const userFields = createUserFields(server);

    const mailbox = server.create('mailbox', { is_default: true });
    server.create('channel', { account: { id: mailbox.id, resource_type: 'mailbox' } });

    const organization = server.create('organization');
    const team = server.create('team');
    const role = server.create('role', {title: 'Admin', type: 'ADMIN', id: 1});

    server.create('contact-address');
    server.create('contact-website');

    server.create('identity-domain');
    const identityEmail = server.create('identity-email');
    server.create('identity-phone');

    const custom_fields = createUserFieldValues(server, userFields);
    const metadata = server.create('metadata');
    const defaultUser = server.create('user', {
      custom_fields: custom_fields,
      emails: [{ id: identityEmail.id, resource_type: 'identityEmail' }],
      locale: { id: enUsLocale.id, resource_type: 'locale' },
      organization: { id: organization.id, resource_type: 'organization' },
      role: { id: role.id, resource_type: 'role' },
      teams: [{ id: team.id, title: team.title, resource_type: 'team' }],
      time_zone: 'Europe/London'
    });

    server.create('session', { user: { id: defaultUser.id, resource_type: 'user' }});

    const columns = server.createList('column', 5);
    const propositionAssignedToCurrentUser = server.create('proposition', {
      field: 'cases.assigneeagentid',
      operator: 'comparison_equalto',
      value: '(current_user)'
    });
    const stringProposition = server.create('proposition', {
      field: 'cases.subject',
      operator: 'string_contains',
      value: 'dave'
    });
    const inboxPredicateCollection = server.create('predicate-collection', {
      propositions: [{ id: propositionAssignedToCurrentUser.id, resource_type: 'proposition' }]
    });
    const simplePredicateCollection = server.create('predicate-collection', {
      propositions: [{ id: stringProposition.id, resource_type: 'proposition' }]
    });

    let inboxView = server.create('view', {
      title: 'Inbox',
      is_default: true,
      is_enabled: true,
      is_system: true,
      order_by: 'ASC',
      order_by_column: 'caseid',
      columns: columns,
      predicate_collections: [{ id: inboxPredicateCollection.id, resource_type: 'predicate_collection' }],
      sort_order: 1,
      type: 'INBOX'
    });

    let sampleView = server.create('view', {
      title: 'Test basic custom view',
      is_default: false,
      is_enabled: true,
      is_system: false,
      order_by: 'ASC',
      order_by_column: 'caseid',
      columns: columns,
      predicate_collections: [{ id: simplePredicateCollection.id, resource_type: 'predicate_collection' }],
      sort_order: 2,
      type: 'CUSTOM',
      visibility_type: 'ALL'
    });

    let trashView = server.create('view', {
      title: 'Trash',
      is_default: false,
      is_enabled: true,
      is_system: true,
      sort_order: 5,
      type: 'TRASH'
    });

    let operatorsForInputTypeString = [
      'string_contains',
      'string_does_not_contain'
    ];

    server.create('definition', {
      field: 'cases.subject',
      group: 'CASES',
      type: 'STRING',
      sub_type: '',
      input_type: 'STRING',
      label: 'STRING',
      operators: operatorsForInputTypeString,
      values: ''
    });

    const assignedAgent = defaultUser;
    const assignedTeam = team;
    const brand = server.create('brand', { locale: enUsLocale });
    const statuses = server.createList('case-status', 5);
    const status = statuses[0];
    const priority = server.create('case-priority');
    const type = server.create('type');
    const slaVersion = server.create('sla-version');
    const caseSlaMetrics = server.createList('sla-metric', 3);
    const tags = server.createList('tag', 2);

    const caseFields = server.createList('case-field', 14);

    let casesProto = {
      source_channel: null,
      requester: defaultUser,
      creator: defaultUser,
      identity: identityEmail,
      assignedAgent: assignedAgent,
      assignedTeam: assignedTeam,
      brand: brand,
      status: status,
      priority: priority,
      type: type,
      sla_version: slaVersion,
      sla_metrics: caseSlaMetrics,
      tags: tags,
      custom_fields: [],
      metadata: metadata,
      last_replier: defaultUser,
      last_replier_identity: identityEmail
    };

    let inboxCases = server.createList('case', 22, Object.assign(casesProto, { _view_ids: [inboxView.id] }));
    server.create('view-count', {
      count: inboxCases.length,
      view: { id: inboxView.id, resource_type: 'view' }
    });
    let sampleViewCases = server.createList('case', 22, Object.assign(casesProto, { _view_ids: [sampleView.id] }));
    server.create('view-count', {
      count: sampleViewCases.length,
      view: { id: sampleView.id, resource_type: 'view' }
    });
    let trashCases = server.createList('case', 10, Object.assign(casesProto, { _view_ids: [trashView.id] }));
    server.create('view-count', {
      count: trashCases.length,
      view: { id: trashView.id, resource_type: 'view' }
    });

    server.createList('case-priority', 3);
    server.createList('case-type', 4, {
      resource_url: (i) => {
        return 'http://novo/api/index.php?/v1/cases/types/' + ++i;
      }
    });
    server.create('case-form', {
      fields: caseFields,
      brand: brand
    });

    const limit = server.create('plan-limit', {
      collaborators: 10,
      agents: 5
    });

    const feature = server.create('feature', {
      code: 3232,
      name: 'collaborators',
      description: 'People who may log in as a team member'
    });

    server.create('plan', { limits: limit, features: [feature], account_id: '123', subscription_id: '123' });

    const macroAssignee = server.create('macro-assignee');
    const macroVisibility = server.create('macro-visibility');

    server.create('macro', {
      agent: defaultUser,
      assignee: macroAssignee,
      visibility: macroVisibility
    });

    login();
  },

  afterEach() {
    logout();
  }
});

test('Unavailable views redirect to default', function(assert) {
  assert.expect(1);
  visit('/agent/conversations/view/666');

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/view/1');
  });
});

test('Selecting cases shows trash button and bulk sidebar, hides pagination', function(assert) {
  assert.expect(6);
  visit('/agent/conversations/view/1');

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/view/1');
    assert.equal(find('.qa-cases-list__trash').length, 0);
  });

  andThen(function() {
    assert.ok(find('.qa-pagination-container').length);
    click(`tbody .${checkboxStyles.checkbox}:first`);
  });

  andThen(function() {
    assert.equal(find('.qa-cases-list__trash').length, 1);
    assert.notOk(find('.qa-pagination-container').length);
    assert.equal(find(`.${bulkSidebarStyles.title}`).text().trim(), 'Update Conversations');
  });
});

test('Select all conversations', function(assert) {
  assert.expect(2);
  visit('/agent/conversations/view/1');

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/view/1');
  });

  andThen(function() {
    click(`thead .${checkboxStyles.checkbox}:first`);
  });

  andThen(function() {
    assert.equal(find(`.${checkboxStyles.checkbox}`).attr('aria-checked'), 'true');
  });
});

test('Show confirmation when trashing cases', function(assert) {
  assert.expect(2);

  visit('/agent/conversations/view/1');

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/view/1');
  });

  andThen(function() {
    click(`thead .${checkboxStyles.checkbox}:first`);
  });

  andThen(function() {
    click('.qa-cases-list__trash');
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
  });
});
