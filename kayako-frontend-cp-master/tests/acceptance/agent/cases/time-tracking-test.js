import { app } from 'frontend-cp/tests/helpers/qunit';
import { createCustomer } from 'frontend-cp/mirage/scenarios/users';
import { createCaseForView } from 'frontend-cp/mirage/scenarios/cases';
import { test } from 'qunit';

app('Acceptance | Conversation | Time tracking', {
  beforeEach() {
    useDefaultScenario();

    let customerUser = createCustomer(server, 'Charlie Ustomer');

    createCaseForView(server, {caseId: 11111, subject: 'new case', requester: customerUser});
    login();
  },

  afterEach() {
    logout();
  }
});

test('open dropdown', async function(assert) {
  await visit('/agent/conversations/11111');
  await click('.qa-time-tracking-trigger');
  assert.equal(find('.qa-time-tracking-dropdown').length, 1);
});

test('add new entry', async function(assert) {
  await visit('/agent/conversations/11111');
  await click('.qa-time-tracking-trigger');
  await fillIn('.seconds-input', '22');
  await click('.qa-save-button');
  assert.equal(find('.tracking-entry').length, 1);
});

test('delete entry', async function(assert) {
  await visit('/agent/conversations/11111');
  await click('.qa-time-tracking-trigger');
  await fillIn('.seconds-input', '22');
  await click('.qa-save-button');
  await click('.delete-entry');
  assert.equal(find('.tracking-entry').length, 0);
});
