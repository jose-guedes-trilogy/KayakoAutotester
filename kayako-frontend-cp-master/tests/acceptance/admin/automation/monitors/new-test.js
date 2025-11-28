import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';
import modalStyles from 'frontend-cp/components/ko-modal/styles';

let role;

app('Acceptance | admin/automation/monitors - Create a monitor', {
  beforeEach() {
    /*eslint-disable quote-props*/
    const locale = server.create('locale', {
      locale: 'en-us'
    });

    role = server.create('role', { type: 'ADMIN' });
    const agent = server.create('user', { role, locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });

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
        5: 'Closed',
        4: 'Completed',
        1: 'New',
        2: 'Open',
        3: 'Pending'
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
        4: 'Incident',
        3: 'Problem',
        1: 'Question',
        2: 'Task'
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
        3: 'High',
        1: 'Low',
        2: 'Normal',
        4: 'Urgent'
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
        1: 'Active',
        3: 'Spam',
        2: 'Trash'
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
        1: 'Default'
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
        0: 'unassigned',
        '(current users team)': '(current users team)',
        5: 'Contractors',
        3: 'Finance',
        4: 'Human Resources',
        1: 'Sales',
        2: 'Support'
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
        1: 'breached'
      }
    });

    login(session.id);

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    /*eslint-enable quote-props*/
  },

  afterEach() {
    role = null;
    logout();
  }
});

test('Exit having pending changes ask for confirmation', function(assert) {
  assert.expect(3);

  visit('/admin/automation/monitors/new');

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors/new');
    fillIn('input[name="title"]', 'Sample monitor name');
    click('.qa-ko-form_buttons__cancel');
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors');
  });
});

test('Exit without having pending changes doesn\'t ask for confirmation', function(assert) {
  assert.expect(2);

  visit('/admin/automation/monitors/new');

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors/new');
    click('.qa-ko-form_buttons__cancel');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors');
  });
});
