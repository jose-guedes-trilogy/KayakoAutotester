import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import infoBarItemStyles from 'frontend-cp/components/ko-info-bar/item/styles';
import { createCustomer } from 'frontend-cp/mirage/scenarios/users';
import { createCaseForView } from 'frontend-cp/mirage/scenarios/cases';

app('Acceptance | Conversation | User', {
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

test('Update a user with invalid info highlights the errors', function(assert) {
  let locale = server.create('locale', { locale: 'en-us' });
  let agentRole = server.create('role', { type: 'AGENT' });
  let agent = server.create('user', { role: agentRole, locale: locale, time_zone: 'Europe/London' });
  server.db.cases.update(11111, { requester: agent });
  visit('/agent/conversations/11111/user');

  andThen(function() {
    selectChoose('.ko-user-content__role-field', 'Agent');
    click('.qa-user-content__submit-properties');
  });

  andThen(function() {
    assert.equal(find(`.user-team-ids-field .${infoBarItemStyles.containerError}`).length, 1, 'The teams field contains errors');
  });
});
