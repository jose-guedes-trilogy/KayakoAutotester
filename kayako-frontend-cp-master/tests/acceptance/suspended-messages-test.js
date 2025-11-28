/*eslint-disable camelcase */

import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

import checkboxStyles from 'frontend-cp/components/ko-checkbox/styles';
import modalStyles from 'frontend-cp/components/ko-modal/styles';

app('Acceptance | suspended messages', {
  beforeEach() {
    const locale = server.create('locale', { locale: 'en-us' });
    const brand = server.create('brand', { locale });
    const caseFields = server.createList('case-field', 4);
    const mailbox = server.create('mailbox', { brand });
    server.create('channel', { account: { id: mailbox.id, resource_type: 'mailbox' } });
    server.create('case-form', {
      fields: caseFields,
      brand: brand
    });
    const agentRole = server.create('role', { type: 'AGENT' });
    const agent = server.create('user', { role: agentRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    login(session.id);

    server.create('plan', {
      limits: {},
      features: [],
      account_id: '123',
      subscription_id: '123'
    });

    for (let i = 0; i < 22; i++) {
      server.create('mail', {
        is_suspended: true,
        status: 'SUSPENDED',
        suspension_code: 'SPAM',
        from: `client${i}@example.com`,
        subject: `subject${i}`
      });
    }
  },

  afterEach() {
    logout();
  }
});

test('view and paginate suspended messages', function(assert) {
  visit('/agent/conversations/suspended-messages');

  andThen(function() {
    assert.equal($('.qa-suspended-messages-section__table tbody tr').length, 20, 'There is 20 mails in the first page');
    assert.equal($('.qa-pagination-active').text().trim(), '1', 'This is page 1... ');

    assert.equal($('.qa-suspended-messages-section__table tbody tr:eq(0) td:eq(1)').text().trim(), 'client0@example.com');
    click('.qa-pagination-2');
  });

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/suspended-messages?page=2');
    assert.equal($('.qa-suspended-messages-section__table tbody tr').length, 2, 'There is 2 mails in the second page');
    assert.equal($('.qa-suspended-messages-section__table tbody tr:eq(0) td:eq(1)').text().trim(), 'client20@example.com');
    assert.equal($('.qa-pagination-active').text().trim(), '2', 'This is page 2');
  });
});

test('open detail of a message and exit detail', function(assert) {
  visit('/agent/conversations/suspended-messages');

  andThen(function() {
    click($('.qa-suspended-messages-section__table tbody tr:eq(2)'));
  });

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/suspended-messages/3');
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened with the message clicked');
    assert.equal($('.qa-suspended-message-modal__table-row:eq(0) td').text().trim(), 'client2@example.com', 'The data seems correct');
    click('a:contains("Cancel")');
  });

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/suspended-messages');
    assert.equal($(`.${modalStyles.content}`).length, 0, 'The modal is gone');
  });
});


test('delete permanently the opened message', function(assert) {
  visit('/agent/conversations/suspended-messages');

  andThen(function() {
    click($('.qa-suspended-messages-section__table tbody tr:eq(2)'));
  });

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/suspended-messages/3');
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened with the message clicked');
    assert.equal($('.qa-suspended-message-modal__table-row:eq(0) td').text().trim(), 'client2@example.com', 'The data seems correct');
    click('button:contains("Permanently delete")');
  });

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/suspended-messages');
    assert.equal($(`.${modalStyles.content}`).length, 0, 'The modal is gone');
    assert.equal($('.qa-suspended-messages-section__table tbody tr').length, 19, 'Message was deleted');
  });
});

test('allow to passthough the opened message', function(assert) {
  visit('/agent/conversations/suspended-messages');

  andThen(function() {
    click($('.qa-suspended-messages-section__table tbody tr:eq(2)'));
  });

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/suspended-messages/3');
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened with the message clicked');
    assert.equal($('.qa-suspended-message-modal__table-row:eq(0) td').text().trim(), 'client2@example.com', 'The data seems correct');
    click('button:contains("Allow through")');
  });

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/suspended-messages');
    assert.equal($(`.${modalStyles.content}`).length, 0, 'The modal is gone');
    assert.equal($('.qa-suspended-messages-section__table tbody tr').length, 19, 'Message was deleted');
  });
});

test('delete permanently in batch', function(assert) {
  visit('/agent/conversations/suspended-messages?page=2');

  andThen(function() {
    assert.equal($('.suspended-messages-section__delete-all').length, 0, 'There is no button to delete ni batch visible');
    click(`.qa-suspended-messages-section__table tbody tr .${checkboxStyles.checkbox}:eq(0)`);
    click(`.qa-suspended-messages-section__table tbody tr .${checkboxStyles.checkbox}:eq(1)`);
  });

  andThen(function() {
    assert.equal($('.suspended-messages-section__delete-all').length, 1, 'The button to delete in batch appeared');
    click('.suspended-messages-section__delete-all');
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(currentURL(), '/agent/conversations/suspended-messages');
    assert.equal($('.qa-suspended-messages-section__table tbody tr').length, 20, 'Message was deleted');
    assert.equal($('.suspended-messages-section__delete-all').length, 0, 'The button to delete in batch is gone again');
  });
});
