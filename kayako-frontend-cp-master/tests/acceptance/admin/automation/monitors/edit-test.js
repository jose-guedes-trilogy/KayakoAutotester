import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';
import modalStyles from 'frontend-cp/components/ko-modal/styles';
import propositionStyles from 'frontend-cp/components/ko-admin/predicate-builder/proposition/styles';

let monitor;

app('Acceptance | admin/automation/monitors - Edit a monitor', {
  beforeEach() {
    /*eslint-disable quote-props*/
    const locale = server.create('locale', {
      locale: 'en-us'
    });

    const adminRole = server.create('role', { type: 'ADMIN' });
    const agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
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

    let proposition = server.create('proposition', {
      field: 'cases.subject',
      operator: 'string_contains',
      value: 'dave'
    });
    let collection = server.create('predicate-collection', {
      propositions: [{ id: proposition.id, resource_type: 'proposition'}]
    });
    let action = server.create('automation-action');
    monitor = server.create('monitor', {
      predicate_collections: [
        { id: collection.id, resource_type: 'predicate_collection' }
      ],
      action: { id: action.id, resource_type: 'automation-action' }
    });

    login(session.id);

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    /*eslint-enable quote-props*/
  },

  afterEach() {
    logout();
  }
});

test('Edit an existing monitor', function(assert) {
  assert.expect(15);

  visit(`/admin/automation/monitors/${monitor.id}`);

  andThen(function() {
    assert.equal(currentURL(), `/admin/automation/monitors/${monitor.id}`);
    click('.qa-predicate-builder__add');

    selectChoose('.qa-predicate-builder--proposition-0-1 .qa-proposition--column', 'Subject');
    selectChoose('.qa-predicate-builder--proposition-0-1 .qa-proposition--operator', 'does not contain');
    fillIn('.qa-predicate-builder--proposition-0-1 input:last', 'collection1proposition2');

    click('.qa-predicate-builder__new');

    selectChoose('.qa-predicate-builder--proposition-1-0 .qa-proposition--column', 'Subject');
    selectChoose('.qa-predicate-builder--proposition-1-0 .qa-proposition--operator', 'does not contain');
    fillIn('.qa-predicate-builder--proposition-1-0 input:last', 'collection2proposition1');

    click(`.${propositionStyles.remove}:nth-child(1)`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors');
    assert.equal(find(`.qa-admin_monitors--enabled .${rowStyles.row}`).length, 1, 'The monitor is still enabled');
    assert.equal(find(`.qa-admin_monitors--disabled .${rowStyles.row}`).length, 0, 'There is no disabled monitors');
    click(`.qa-admin_monitors--enabled .${rowStyles.row}`);
  });

  andThen(function() {
    assert.equal(currentURL(), `/admin/automation/monitors/${monitor.id}`);
    assert.equal(find('.qa-predicate-builder').length, 2, 'There is 2 predicate collections');
    assert.equal(find('.qa-predicate-builder-0 .qa-predicate-builder--proposition').length, 1, 'There is 1 proposition in the first predicate collection');
    assert.equal(find('.qa-predicate-builder-1 .qa-predicate-builder--proposition').length, 1, 'There is 1 proposition in the second predicate collection');
    click('.qa-predicate-builder__remove-0'); // Remove the first predicate collection
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors');
    assert.equal(find(`.qa-admin_monitors--enabled .${rowStyles.row}`).length, 1, 'The monitor is still enabled');
    assert.equal(find(`.qa-admin_monitors--disabled .${rowStyles.row}`).length, 0, 'There is no disabled monitors');
    click(`.qa-admin_monitors--enabled .${rowStyles.row}`);
  });

  andThen(function() {
    assert.equal(currentURL(), `/admin/automation/monitors/${monitor.id}`);
    assert.equal(find('.qa-predicate-builder').length, 1, 'There is 1 predicate collection');
    assert.equal(find('.qa-predicate-builder-0 .qa-predicate-builder--proposition').length, 1, 'There is 1 proposition in the first predicate collection');
    assert.equal(find('.qa-predicate-builder_proposition__input').val(), 'collection2proposition1', 'The proposition left is the expected one');
  });
});

test('Exit having pending changes ask for confirmation', function(assert) {
  assert.expect(3);

  visit(`/admin/automation/monitors/${monitor.id}`);

  andThen(function() {
    assert.equal(currentURL(), `/admin/automation/monitors/${monitor.id}`);
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

  visit(`/admin/automation/monitors/${monitor.id}`);

  andThen(function() {
    assert.equal(currentURL(), `/admin/automation/monitors/${monitor.id}`);
    click('.qa-ko-form_buttons__cancel');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/automation/monitors');
  });
});
