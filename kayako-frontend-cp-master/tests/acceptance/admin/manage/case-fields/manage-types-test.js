import { test } from 'qunit';
import moduleForAcceptance from 'frontend-cp/tests/helpers/module-for-acceptance';
import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';

const caseFieldId = 1;

moduleForAcceptance('Acceptance | admin/manage/cases/types', {
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
      title: 'Type',
      is_system: true,
      type: 'TYPE'
    });

    server.createList('case-type', 3, {
      label: (i) => `Test Type ${i + 1}`,
      type: 'CUSTOM'
    });
    let typesFeature = server.create('feature', { code: 'custom_case_types' });
    server.create('plan', { limits: { agents: 20 }, features: [typesFeature], account_id: '123', subscription_id: '123' });
  },

  afterEach: function() {
    logout();
  }
});

test('creating a type', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);
  click('.types__add-type-message');
  fillIn('.qa-custom-type-label-input', 'New Type');
  click('.qa-custom-type-save');

  andThen(function() {
    assert.equal(find('.qa-custom-type-label:contains("New Type")').length, 1);
  });
});

test('editing a type', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);
  triggerEvent(`.${rowStyles.row}:first`, 'mouseenter');

  andThen(function() {
    click('.qa-custom-type-edit:first');
    fillIn('.qa-custom-type-label-input', 'Edited Type');
    click('.qa-custom-type-save');
  });

  andThen(function() {
    assert.equal(find('.qa-custom-type-label:contains("Edited Type")').length, 1);
    assert.equal(find('.qa-custom-type-label:contains("Test Type 1")').length, 0);
  });
});

test('deleting a type', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);

  triggerEvent(`.${rowStyles.row}:first`, 'mouseenter');

  click('.qa-custom-type-delete:first');
  click('.qa-ko-confirm-modal__confirm');

  andThen(function() {
    assert.equal(find('.qa-custom-type-label:contains("Test Type 1")').length, 0);
  });
});

test('cancelling deletion of a type', function(assert) {
  visit(`/admin/customizations/conversation-fields/${caseFieldId}`);

  triggerEvent(`.${rowStyles.row}:first`, 'mouseenter');

  click('.qa-custom-type-delete:first');
  click('.qa-ko-confirm-modal__cancel');

  andThen(function() {
    assert.equal(find('.qa-custom-type-label:contains("Test Type 1")').length, 1);
  });
});
