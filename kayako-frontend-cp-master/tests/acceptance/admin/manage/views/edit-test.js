import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

let view;

app('Acceptance | admin/conversations/views/edit', {
  beforeEach() {
    /*eslint-disable quote-props*/
    server.create('locale', {
      locale: 'en-us'
    });

    let columns = [
      server.create('column', { name: 'caseid', title: 'Conversation ID' }),
      server.create('column', { name: 'subject', title: 'Subject' }),
      server.create('column', { name: 'casestatusid', title: 'Status' }),
      server.create('column', { name: 'casepriorityid', title: 'Priority' }),
      server.create('column', { name: 'casetypeid', title: 'Type' }),
      server.create('column', { name: 'assigneeagentid', title: 'Assigned agent' }),
      server.create('column', { name: 'assigneeteamid', title: 'Assigned team' }),
      server.create('column', { name: 'brandid', title: 'Brand' }),
      server.create('column', { name: 'channeltype', title: 'Channel type' }),
      server.create('column', { name: 'createdat', title: 'Created at' }),
      server.create('column', { name: 'updatedat', title: 'Updated at' }),
      server.create('column', { name: 'requesterid', title: 'Requester' })
    ];

    const businesshour = server.create('business-hour', { title: 'Default Business Hours' });
    let teams = [
      server.create('team', { title: 'Sales', businesshour: businesshour }),
      server.create('team', { title: 'Support', businesshour: businesshour }),
      server.create('team', { title: 'Finance', businesshour: businesshour }),
      server.create('team', { title: 'Human Resources', businesshour: businesshour }),
      server.create('team', { title: 'Contractors', businesshour: businesshour })
    ];

    server.create('definition', {
      label: 'Subject',
      field: 'cases.subject',
      type: 'STRING',
      sub_type: '',
      group: 'CASES',
      input_type: 'STRING',
      operators: [
        'string_contains',
        'string_does_not_contain'
      ],
      values: ''
    });

    server.create('definition', {
      label: 'Status',
      field: 'cases.casestatusid',
      type: 'NUMERIC',
      sub_type: 'INTEGER',
      group: 'CASES',
      input_type: 'OPTIONS',
      operators: [
        'comparison_equalto',
        'comparison_not_equalto',
        'comparison_lessthan',
        'comparison_greaterthan'
      ],
      values: {
        '5': 'Closed',
        '4': 'Completed',
        '1': 'New',
        '2': 'Open',
        '3': 'Pending'
      }
    });

    server.create('definition', {
      label: 'Type',
      field: 'cases.casetypeid',
      type: 'NUMERIC',
      sub_type: 'INTEGER',
      group: 'CASES',
      input_type: 'OPTIONS',
      operators: [
        'comparison_equalto',
        'comparison_not_equalto'
      ],
      values: {
        '4': 'Incident',
        '3': 'Problem',
        '1': 'Question',
        '2': 'Task'
      }
    });

    server.create('definition', {
      label: 'Priority',
      field: 'cases.casepriorityid',
      type: 'NUMERIC',
      sub_type: 'INTEGER',
      group: 'CASES',
      input_type: 'OPTIONS',
      operators: [
        'comparison_equalto',
        'comparison_not_equalto',
        'comparison_lessthan',
        'comparison_greaterthan'
      ],
      values: {
        '3': 'High',
        '1': 'Low',
        '2': 'Normal',
        '4': 'Urgent'
      }
    });

    server.create('definition', {
      label: 'State',
      field: 'cases.state',
      type: 'NUMERIC',
      sub_type: 'INTEGER',
      group: 'CASES',
      input_type: 'OPTIONS',
      operators: [
        'comparison_equalto'
      ],
      values: {
        '1': 'Active',
        '3': 'Spam',
        '2': 'Trash'
      }
    });

    server.create('definition', {
      label: 'Brand',
      field: 'cases.brandid',
      type: 'NUMERIC',
      sub_type: 'INTEGER',
      group: 'CASES',
      input_type: 'OPTIONS',
      operators: [
        'comparison_equalto',
        'comparison_not_equalto'
      ],
      values: {
        '1': 'Default'
      }
    });

    server.create('definition', {
      label: 'Assigned Agent Team',
      field: 'cases.assigneeteamid',
      type: 'NUMERIC',
      sub_type: 'INTEGER',
      group: 'CASES',
      input_type: 'OPTIONS',
      operators: [
        'comparison_equalto',
        'comparison_not_equalto'
      ],
      values: {
        '0': 'unassigned',
        '(current users team)': '(current users team)',
        '5': 'Contractors',
        '3': 'Finance',
        '4': 'Human Resources',
        '1': 'Sales',
        '2': 'Support'
      }
    });

    server.create('definition', {
      label: 'Assigned agent',
      field: 'cases.assigneeagentid',
      type: 'NUMERIC',
      sub_type: 'INTEGER',
      group: 'CASES',
      input_type: 'AUTOCOMPLETE',
      operators: [
        'comparison_equalto',
        'comparison_not_equalto'
      ],
      values: ''
    });

    server.create('definition', {
      label: 'Requester',
      field: 'cases.requesterid',
      type: 'NUMERIC',
      sub_type: 'INTEGER',
      group: 'CASES',
      input_type: 'AUTOCOMPLETE',
      operators: [
        'comparison_equalto',
        'comparison_not_equalto'
      ],
      values: ''
    });

    server.create('definition', {
      label: 'Tags',
      field: 'tags.name',
      type: 'COLLECTION',
      sub_type: '',
      group: 'CASES',
      input_type: 'TAGS',
      operators: [
        'collection_contains_insensitive',
        'collection_does_not_contain_insensitive',
        'collection_contains_any_insensitive'
      ],
      values: ''
    });

    server.create('definition', {
      label: 'Organization',
      field: 'users.organizationid',
      type: 'NUMERIC',
      sub_type: 'INTEGER',
      group: 'CASES',
      input_type: 'AUTOCOMPLETE',
      operators: [
        'comparison_equalto',
        'comparison_not_equalto'
      ],
      values: ''
    });

    server.create('definition', {
      label: 'Following',
      field: 'followers.userid',
      type: 'NUMERIC',
      sub_type: 'INTEGER',
      group: 'CASES',
      input_type: 'OPTIONS',
      operators: [
        'comparison_equalto',
        'comparison_not_equalto'
      ],
      values: {
        '(current user)': '(current user)'
      }
    });

    server.create('definition', {
      label: 'SLA Breached',
      field: 'caseslametrics.isbreached',
      type: 'NUMERIC',
      sub_type: 'INTEGER',
      group: 'CASES',
      input_type: 'OPTIONS',
      operators: [
        'comparison_equalto',
        'comparison_not_equalto'
      ],
      values: {
        '1': 'breached'
      }
    });

    const adminRole = server.create('role', { type: 'ADMIN' });
    const locale = server.create('locale', { locale: 'en-us' });
    const agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    login(session.id);
    server.create('view');
    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    const stringProposition = server.create('proposition', {
      field: 'cases.subject',
      operator: 'string_contains',
      value: 'dave'
    });
    const predicateCollections = [
      server.create('predicate-collection', { propositions: [stringProposition] })
    ];
    view = server.create('view', {
      title: 'Engineering',
      type: 'CUSTOM',
      visibility_type: 'TEAM',
      order_by_column: 'createdat',
      order_by: 'DESC',
      is_default: false,
      is_system: false,
      is_enabled: true,
      agent: { id: agent.id, resource_type: 'user' },
      visibility_to_teams: teams.map(t => ({ id: t.id, resource_type: 'team' })),
      columns: columns.map(c => ({ name: c.name, resource_type: 'column' })),
      predicate_collections: predicateCollections.map(pc => ({ id: pc.id, resource_type: 'predicate_collection' }))
    });
    /*eslint-enable quote-props*/
  },

  afterEach() {
    logout();
  }
});


test('editing a view and leaving without making changes', function(assert) {
  visit(`/admin/conversations/views/${view.id}`);

  andThen(function() {
    assert.equal(currentURL(), `/admin/conversations/views/${view.id}`);
    click('.qa-ko-form_buttons__cancel');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/conversations/views');
  });
});
