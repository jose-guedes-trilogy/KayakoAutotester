import { app, test } from 'frontend-cp/tests/helpers/qunit';

const caseFieldId = 1;

app('Acceptance | admin/manage/cases/statuses', {
  beforeEach: function() {
    server.create('setting', {
      category: 'account',
      name: 'default_language',
      value: 'en-us'
    });
    const locale = server.create('locale', {
      id: 1,
      locale: 'en-us',
      is_public: true
    });
    const role = server.create('role', { type: 'ADMIN' });
    const agent = server.create('user', { role: role, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });

    login(session.id);

    server.create('case-field', {
      id: caseFieldId,
      title: 'Status',
      is_system: true,
      type: 'STATUS'
    });

    server.create('case-status', {
      label: 'Pending',
      is_system: true,
      type: 'PENDING',
      is_sla_active: true
    });

    server.create('case-status', {
      label: 'Open',
      is_system: true,
      type: 'OPEN',
      is_sla_active: true
    });

    server.createList('case-status', 3, {
      label: (i) => `Test Status ${i + 1}`,
      is_system: false,
      type: 'CUSTOM',
      is_sla_active: false
    });
    let statusesFeature = server.create('feature', { code: 'custom_case_statuses' });
    server.create('plan', { limits: { agents: 20 }, features: [statusesFeature], account_id: '123', subscription_id: '123' });
  },

  afterEach: function() {
    logout();
  }
});

test('creating a status', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);
  click('.statuses__add-status-message');
  fillIn('.qa-custom-status-label-input', 'New Status');
  click('.qa-custom-status-sla-toggle div[role="radio"]');
  click('.qa-custom-status-save');

  andThen(function() {
    assert.equal(find('.qa-custom-status-label:contains("New Status")').length, 1);
    assert.equal(find('.qa-custom-status-sla-active:contains("SLA timers active")').length, 1);
  });
});

test('editing a status', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);
  triggerEvent('.qa-custom-row:first', 'mouseenter');
  click('.qa-custom-status-edit:eq(1)');
  fillIn('.qa-custom-status-label-input', 'Edited Status');
  click('.qa-custom-status-save');

  andThen(function() {
    assert.equal(find('.qa-custom-status-label:contains("Edited Status")').length, 1);
    assert.equal(find('.qa-custom-status-label:contains("Test Status 1")').length, 0);
  });
});

test('deleting a status', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);

  triggerEvent('.qa-custom-row:first', 'mouseenter');

  click('.qa-custom-status-delete:eq(1)');
  click('.qa-ko-confirm-modal__confirm');

  andThen(function() {
    assert.equal(find('.qa-custom-status-label:contains("Test Status 1")').length, 0);
  });
});

test('cancelling deletion of a status', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);

  triggerEvent('.qa-custom-row:first', 'mouseenter');

  click('.qa-custom-status-delete:eq(1)');
  click('.qa-ko-confirm-modal__cancel');

  andThen(function() {
    assert.equal(find('.qa-custom-status-label:contains("Test Status 3")').length, 1);
  });
});

test('toggle SLA for Pending status', function(assert) {
  assert.expect(2);

  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);

  andThen(function() {
    assert.equal(find('.qa-pending-status-sla-active:contains("SLA timers active")').length, 1);
  });

  triggerEvent('.qa-pending-row:first', 'mouseenter');
  click('.qa-pending-status-edit:eq(0)');
  click('.qa-pending-status-sla-toggle div[role="radio"]');
  click('.qa-pending-status-save');

  andThen(function() {
    assert.equal(find('.qa-pending-status-sla-active:contains("SLA timers inactive")').length, 1);
  });
});
