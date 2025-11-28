import { test, app } from 'frontend-cp/tests/helpers/qunit';
import { createCustomer } from 'frontend-cp/mirage/scenarios/users';
import { newCaseStatus } from 'frontend-cp/mirage/scenarios/case-statuses';
import { normalCasePriority } from 'frontend-cp/mirage/scenarios/case-priorities';
import { questionCaseType } from 'frontend-cp/mirage/scenarios/case-types';
import { createCaseForView } from 'frontend-cp/mirage/scenarios/cases';

app('Acceptance | Conversation | Update', {
  beforeEach() {
    useDefaultScenario();
    let customerOrganization = server.create('organization', {});

    let customerUser = createCustomer(server, 'Charlie Ustomer', customerOrganization);

    createCaseForView(server, {caseId: 11111, subject: 'new case', status: newCaseStatus(server), priority: normalCasePriority(server), caseType: questionCaseType(server), tags: server.createList('tag', 2), requester: customerUser});
    login();
  },

  afterEach() {
    logout();
  }
});

test('Update, reply and reply & update buttons show up correctly', function(assert) {
  withVariation('release-send-and-status', true);
  visit('/agent/conversations/11111');

  andThen(() => {
    assert.ok(find('.qa-case-content__submit').length === 0, 'submit button is disabled');
    assert.ok(find('.qa-case-content__submit-properties').length === 0, 'submit properties button is disabled');
    assert.ok(find('.qa-ko-case-content__cancel').length === 0, 'cancel button is disabled');
  });

  selectChoose('.qa-ko-case-content__status', 'Pending');

  andThen(() => {
    assert.ok(find('.qa-case-content__submit').length === 0, 'submit button is disabled');
    assert.ok(find('.qa-case-content__submit-properties:not([disabled])').length === 1, 'submit properties button is enabled');
    assert.ok(find('.qa-ko-case-content__cancel').length === 1, 'cancel button is enabled');
    assert.equal(find('.qa-case-content__submit-properties').text().trim(), 'Update properties', 'submit button text is correct');
  });

  andThen(() => {
    click('.qa-ko-case-content__cancel');
    fillInRichTextEditor('Message');
  });

  andThen(() => {
    assert.ok(find('.qa-case-content__submit:not([disabled])').length === 1, 'submit button is enabled');
    assert.ok(find('.qa-case-content__submit-properties').length === 0, 'submit properties button is disabled');
    assert.ok(find('.qa-ko-case-content__cancel').length === 0, 'cancel button is disabled');
    assert.equal(find('.qa-case-content__submit').text().trim(), 'Send', 'submit button text is correct');
  });

  let status = 'Pending';
  selectChoose('.qa-ko-case-content__status', status);

  andThen(() => {
    assert.ok(find('.qa-case-content__submit:not([disabled])').length === 1, 'submit button is enabled');
    assert.ok(find('.qa-case-content__submit-properties:not([disabled])').length === 1, 'submit properties button is enabled');
    assert.ok(find('.qa-ko-case-content__cancel').length === 1, 'cancel button is enabled');
    assert.ok(find(`.qa-case-content__submit .qa-send-and-status-${status}`).length === 1, 'submit button has the correct status element');
  });

  selectChoose('.qa-ko-case-content__priority', 'Urgent');

  andThen(() => {
    assert.ok(find('.qa-case-content__submit:not([disabled])').length === 1, 'submit button is enabled');
    assert.ok(find('.qa-case-content__submit-properties:not([disabled])').length === 1, 'submit properties button is enabled');
    assert.ok(find('.qa-ko-case-content__cancel').length === 1, 'cancel button is enabled');
    assert.ok(find('.qa-case-content__submit .qa-send-and-status-pending').length === 0, 'submit button does not have the status element');
    assert.equal(find('.qa-case-content__submit').text().trim(), 'Send and update', 'submit button text is correct');
  });
});

test('Tag added', function(assert) {
  assert.expect(4);
  visit('/agent/conversations/11111');
  let tagCount;

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/11111');
    assert.ok(find('.qa-case-content__submit-properties').length === 0);
    tagCount = find('.qa-ko-case-content__tags .qa-ko-select_multiple_pill').length;
    fillIn('.qa-ko-case-content__tags input', 'Test ');
  });

  andThen(function() {
    find('.qa-ko-case-content__tags input').trigger($.Event('keydown', { which: 13, keyCode: 13 }));
  });

  andThen(function() {
    assert.equal(find('.qa-ko-case-content__tags .qa-ko-select_multiple_pill').length, tagCount + 1);
    assert.ok(find('.qa-case-content__submit-properties:not([disabled])').length === 1);
  });
});

test('Tag removed', function(assert) {
  assert.expect(4);
  visit('/agent/conversations/11111');
  let tagCount;

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/11111');
    assert.ok(find('.qa-case-content__submit-properties').length === 0);
    tagCount = find('.qa-ko-case-content__tags .qa-ko-select_multiple_pill').length;
    click('.qa-ko-case-content__tags .qa-ko-select_multiple_pill:first [role=button]');
  });

  andThen(function() {
    assert.equal(find('.qa-ko-case-content__tags .qa-ko-select_multiple_pill').length, tagCount - 1);
    assert.ok(find('.qa-case-content__submit-properties:not([disabled])').length === 1);
  });
});
