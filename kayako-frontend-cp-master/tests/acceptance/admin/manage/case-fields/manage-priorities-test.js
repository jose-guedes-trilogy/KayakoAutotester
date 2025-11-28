import { app, test } from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';

const caseFieldId = 1;

app('Acceptance | admin/manage/cases/priorities', {
  beforeEach: function() {
    const role = server.create('role', { type: 'ADMIN' });
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
    const agent = server.create('user', { role: role, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });

    login(session.id);

    server.create('case-field', {
      id: caseFieldId,
      title: 'Priority',
      is_system: true, // eslint-disable-line camelcase
      type: 'PRIORITY'
    });

    server.createList('case-priority', 3, {
      label: (i) => `Test Priority ${i + 1}`,
      is_system: false, // eslint-disable-line camelcase
      type: 'CUSTOM',
      is_sla_active: false // eslint-disable-line camelcase
    });
    let prioritiesFeature = server.create('feature', { code: 'custom_case_priorities' });
    server.create('plan', { limits: { agents: 20 }, features: [prioritiesFeature], account_id: '123', subscription_id: '123' });
  },

  afterEach: function() {
    logout();
  }
});

test('creating a priority', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);
  click('.qa-priorities__add-priority-message');
  fillIn('.qa-custom-priority-label-input', 'New Priority');
  click('.qa-custom-priority-save');

  andThen(function() {
    assert.equal(find('.qa-custom-priority-label:contains("New Priority")').length, 1);
  });
});

test('editing a priority', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);
  triggerEvent(`.${rowStyles.row}:first`, 'mouseenter');
  click('.qa-custom-priority-edit:first');
  fillIn('.qa-custom-priority-label-input', 'Edited Priority');
  click('.qa-custom-priority-save');

  andThen(function() {
    assert.equal(find('.qa-custom-priority-label:contains("Edited Priority")').length, 1);
    assert.equal(find('.qa-custom-priority-label:contains("Test Priority 1")').length, 0);
  });
});

test('deleting a priority', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);

  andThen(function() {
    triggerEvent(`.${rowStyles.row}:first`, 'mouseenter');
    assert.equal(find('.qa-custom-priority-label:contains("Test Priority")').length, 3);
    assert.equal(find('.qa-custom-priority-label:contains("Test Priority 1")').length, 1);
  });

  click('.qa-custom-priority-delete:first');
  click('.qa-ko-confirm-modal__confirm');

  andThen(function() {
    assert.equal(find('.qa-custom-priority-label:contains("Test Priority")').length, 2);
    assert.equal(find('.qa-custom-priority-label:contains("Test Priority 1")').length, 0);
  });
});

test('cancelling deletion of a priority', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);

  triggerEvent(`.${rowStyles.row}:first`, 'mouseenter');

  click('.qa-custom-priority-delete:first');
  click('.qa-ko-confirm-modal__cancel');

  andThen(function() {
    assert.equal(find('.qa-custom-priority-label:contains("Test Priority 1")').length, 1);
  });
});
