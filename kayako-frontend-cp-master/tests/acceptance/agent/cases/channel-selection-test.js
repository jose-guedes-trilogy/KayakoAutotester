import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';
import createSubscription from 'frontend-cp/mirage/scenarios/subscription';
import { createAgent, createCustomer } from 'frontend-cp/mirage/scenarios/users';
import { createCase } from 'frontend-cp/mirage/scenarios/cases';
import { customer as createCustomerRole } from 'frontend-cp/mirage/scenarios/roles';
import { createNoteChannel, createDefaultMailChannel } from 'frontend-cp/mirage/scenarios/channels';
import _ from 'npm:lodash';

app('Acceptance | Agent | Cases | Channel selection', {
  beforeEach() {
    createSubscription(server);
    createCustomerRole(server);
    createNoteChannel(server);
    createDefaultMailChannel(server);

    let user = createAgent(server, 'Alice Agent');
    let session = server.create('session', { user });

    login(session.id);
  }
});

test('opening a case', async function(assert) {
  let { id } = createCase(server);

  await visit(`/agent/cases/${id}`);

  assert.ok(channelSelectorIsEnabled(), 'channel is selected');
  assert.equal(channelSelector().text().trim(), 'support@brewfictus.com',
    'the correct channel is selected');
  assert.ok(noteButtonIsNotSelected(), 'note is not selected');
});

test('resurrecting a case from storage', async function(assert) {
  let { id } = createCase(server);
  let [channel] = server.db.channels.where({ type: 'MAIL' });
  let requester = createCustomer(server, 'Bob Customer');

  sessionStorage.setItem('ko-test:core:tabs', JSON.stringify([{
    basePath: `/agent/cases/${id}`,
    routeName: 'session.agent.cases.case.index',
    dynamicSegments: [id],
    queryParams:null,
    state: {
      case: caseStateWith({
        publicChannelId: String(channel.uuid),
        isNote: false,
        requesterId: String(requester.id)
      })
    },
    processId: `case:${id}`
  }]));

  sessionStorage.setItem('ko-test:core:processes', JSON.stringify([{
    pid:`case:${id}`,
    type:'case',
    modelId: id
  }]));

  await visit(`/agent/cases/${id}`);

  assert.equal(channelSelector().text().trim(), 'support@brewfictus.com',
    'the correct channel is selected');
  assert.ok(noteButtonIsNotSelected(), 'note is not selected');
});

test('resurrecting a case in note mode from storage', async function(assert) {
  let { id } = createCase(server);
  let [channel] = server.db.channels.where({ type: 'MAIL' });
  let requester = createCustomer(server, 'Bob Customer');

  sessionStorage.setItem('ko-test:core:tabs', JSON.stringify([{
    basePath: `/agent/cases/${id}`,
    routeName: 'session.agent.cases.case.index',
    dynamicSegments: [id],
    queryParams:null,
    state: {
      case: caseStateWith({
        publicChannelId: String(channel.uuid),
        isNote: true,
        requesterId: String(requester.id)
      })
    },
    processId: `case:${id}`
  }]));

  sessionStorage.setItem('ko-test:core:processes', JSON.stringify([{
    pid:`case:${id}`,
    type:'case',
    modelId: id
  }]));

  await visit(`/agent/cases/${id}`);

  assert.equal(channelSelector().text().trim(), 'support@brewfictus.com',
    'the correct channel is selected');
  assert.ok(noteButtonIsSelected(), 'note is selected');
});

test('resurrecting a new case in note mode from storage', async function(assert) {
  let [channel] = server.db.channels.where({ type: 'MAIL' });
  let requester = createCustomer(server, 'Bob Customer');

  sessionStorage.setItem('ko-test:core:tabs', JSON.stringify([{
    basePath: '/agent/cases/new/2017-01-01-00-00-00',
    routeName: 'session.agent.cases.new',
    dynamicSegments: ['2017-01-01-00-00-00'],
    queryParams:null,
    state: {
      case: caseStateWith({
        publicChannelId: String(channel.uuid),
        isNote: true,
        requesterId: String(requester.id)
      })
    },
    processId: 'case-new:2017-01-01-00-00-00'
  }]));

  sessionStorage.setItem('ko-test:core:processes', JSON.stringify([{
    pid:'case-new:2017-01-01-00-00-00',
    type:'case-new',
    modelId:'2017-01-01-00-00-00'
  }]));

  await visit('/agent/cases/new/2017-01-01-00-00-00');

  assert.equal(channelSelector().text().trim(), 'support@brewfictus.com',
    'the correct channel is selected');
  assert.ok(noteButtonIsSelected(), 'note is selected');
});

test('selecting note, navigating away, then navigating back', async function(assert) {
  let { id } = createCase(server);

  await visit(`/agent/cases/${id}`);
  await click(noteButton());
  await visit('/agent/welcome');
  await visit(`/agent/cases/${id}`);

  assert.ok(noteButtonIsSelected(), 'note is selected');
});

test('changing brand while note is selected', async function(assert) {
  server.create('brand', { name: 'Brand 2' });

  let { id } = createCase(server);

  await visit(`/agent/cases/${id}`);
  await click(noteButton());
  await click('.qa-ko-case-content__action-menu [role="button"]');
  await click(':contains("Change Brand"):last');
  await click(':contains("Brand 2"):last');

  assert.equal(channelSelector().text().trim(), 'support@brewfictus.com',
    'a reply channel selected');
  assert.ok(noteButtonIsSelected(), 'note is selected');
});

function noteButton() {
  return find('.qa__ko-case-content__note-mode');
}

function channelSelector() {
  return find('.qa-post__channel-selector');
}

function channelSelectorIsEnabled() {
  return !channelSelectorIsDisabled();
}

function channelSelectorIsDisabled() {
  return channelSelector().find('[aria-disabled="true"]').length === 1;
}

function noteButtonIsSelected() {
  return noteButton().attr('aria-selected') === 'true';
}

function noteButtonIsNotSelected() {
  return noteButton().attr('aria-selected') === 'false';
}

function caseStateWith(overrides) {
  let defaults = {
    subject: '',
    postContent: '',
    publicChannelId: null,
    isNote: false,
    inReplyTo:{
      uuid: null,
      id: null
    },
    attachedPostFiles: [],
    replyOptions: {
      type: null,
      cc: []
    },
    timerValue: null,
    isBillable: null,
    noteDestination: null,
    requesterId: null
  };

  return _.merge(defaults, overrides);
}
