/* eslint-disable new-cap */

import { app } from 'frontend-cp/tests/helpers/qunit';
import moment from 'moment';
import { test } from 'qunit';

let customer, caseStatus, agent, agentRole, locale, sourceChannel, identityEmail;

app('Acceptance | Conversation | Subject created at', {
  beforeEach(application) {
    locale = server.create('locale', { locale: 'en-us' });
    let customerRole = server.create('role', { type: 'AGENT' });
    customer = server.create('user', { full_name: 'Mickey Bubbles', role: customerRole, locale: locale, time_zone: 'Europe/London' });

    let brand = server.create('brand', { locale });
    let mailbox = server.create('mailbox', { brand, is_default: true });
    sourceChannel = server.create('channel', { account: { id: mailbox.id, resource_type: 'mailbox' } });

    agentRole = server.create('role', { type: 'AGENT' });

    server.create('plan', {
      limits: {},
      features: []
    });

    identityEmail = server.create('identity-email');
    caseStatus = server.create('case-status');
  },

  afterEach() {
    logout();
  }
});

test('it shows the created date relative to Africa/Casablanca timezone', function(assert) {
  assert.expect(1);

  agent = server.create('user', { role: agentRole, locale: locale, time_zone: 'Africa/Casablanca' });
  let session = server.create('session', { user: agent });
  login(session.id);

  let targetCase = server.create('case', {
    source_channel: sourceChannel,
    requester: customer,
    creator: agent,
    identity: identityEmail,
    status: caseStatus,
    created_at: '2016-07-04T13:22:33+00:00',
    assignee: {
      agent
    }
  });

  visit(`/agent/conversations/${targetCase.id}`);

  andThen(function() {
    let actual = find('.qa-ko-case-content__subject-subtitle').text();
    let expected = 'Jul 4, 2016, 1:22 PM';
    assert.ok(actual.includes(expected), 'No offset from UTC has been applied');
  });
});

test('it shows the created date relative to Indian/Maldives timezone', function(assert) {
  assert.expect(1);

  agent = server.create('user', { role: agentRole, locale: locale, time_zone: 'Indian/Maldives' });
  let session = server.create('session', { user: agent });
  login(session.id);

  let targetCase = server.create('case', {
    source_channel: sourceChannel,
    requester: customer,
    creator: agent,
    identity: identityEmail,
    status: caseStatus,
    created_at: '2016-07-04T13:22:33+00:00',
    assignee: {
      agent
    }
  });

  visit(`/agent/conversations/${targetCase.id}`);

  andThen(function() {
    let actual = find('.qa-ko-case-content__subject-subtitle').text();
    let expected = 'Jul 4, 2016, 6:22 PM';
    assert.ok(actual.includes(expected), 'An offset of 5 hours from UTC has been applied');
  });
});

test('it shows the created date relative to the local time zone if none is specified', function(assert) {
  assert.expect(1);

  agent = server.create('user', { role: agentRole, locale: locale, time_zone: '' });
  let session = server.create('session', { user: agent });
  login(session.id);
  const time = '2016-07-04T13:22:33+00:00';

  let targetCase = server.create('case', {
    source_channel: sourceChannel,
    requester: customer,
    creator: agent,
    identity: identityEmail,
    status: caseStatus,
    created_at: time,
    assignee: {
      agent
    }
  });

  visit(`/agent/conversations/${targetCase.id}`);

  andThen(function() {
    let actual = find('.qa-ko-case-content__subject-subtitle').text();
    let expected = moment(time).format('MMM D, Y, LT');
    assert.ok(actual.includes(expected), 'No offset from UTC has been applied as stubbed date has been used');
  });
});
