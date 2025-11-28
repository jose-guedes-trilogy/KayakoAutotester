import { test } from 'qunit';
import moduleForAcceptance from 'frontend-cp/tests/helpers/module-for-acceptance';
import createSubscription from 'frontend-cp/mirage/scenarios/subscription';
import { createCase } from 'frontend-cp/mirage/scenarios/cases';
import RSVP from 'rsvp';
import rel from 'frontend-cp/mirage/utils/rel';
import gatherSideloadedResources from 'frontend-cp/mirage/utils/gather-sideloaded-resources';
import { fillInRichTextEditorSync } from 'frontend-cp/tests/helpers/fill-in-rich-text-editor';
import { assign } from '@ember/polyfills';
import { run } from '@ember/runloop';
import textEditorStyles from 'frontend-cp/components/ko-text-editor/styles';
import { click } from 'ember-native-dom-helpers';
import {
  POST_STATUS_CLIENT_WAITING,
  POST_STATUS_CLIENT_SENDING,
  POST_STATUS_CLIENT_FAILED,
  POST_STATUS_SENT,
  POST_STATUS_DELIVERED
} from 'frontend-cp/models/post';

const { Promise } = RSVP;

moduleForAcceptance('Acceptance | Conversation | Optimistic Send', {
  beforeEach() {
    server.create('case-field', {
      type: 'STATUS',
      key: 'status',
      title: 'Status'
    });
    let open = server.create('case-status', {
      type: 'OPEN',
      key: 'open',
      label: 'Open'
    });
    server.create('case-status', {
      type: 'PENDING',
      key: 'pending',
      label: 'Pending'
    });

    this.subscription = createSubscription(server);
    this.agent = createAgent(server);
    this.case = createCase(server, { status: open });
    this.session = server.create('session', { user: this.agent });

    login(this.session.id);

    this.requests = [];

    this.pausePostsTo = path => {
      server.pretender.post(path, request => {
        return new Promise((resolve, reject) => {
          assign(request, { resolve, reject });
          this.requests.push(request);
        });
      });
    };

    this.resolveNextRequest = () => {
      let request = this.requests.shift();
      if (!request) { throw new Error('No requests queued'); }
      return resolveRequest(request, { user: this.agent });
    };

    this.rejectNextRequest = (payload) => {
      let request = this.requests.shift();
      if (!request) { throw new Error('No requests queued'); }
      return rejectRequest(request, payload);
    };

    this.timelineState = () => {
      return find('.qa-feed_item--post').toArray().map(el => {
        let text = $(el).find('.ko-feed_item__content').text().trim();
        let status = $(el).attr('data-status');
        let friendlyStatus = friendlyStatusFor(status);
        return [text, friendlyStatus];
      });
    };
  }
});

function friendlyStatusFor(status) {
  switch (status) {
    case POST_STATUS_SENT:
      return 'Sent';
    case POST_STATUS_DELIVERED:
      return 'Delivered';
    case POST_STATUS_CLIENT_WAITING:
      return 'Waiting';
    case POST_STATUS_CLIENT_SENDING:
      return 'Sending';
    case POST_STATUS_CLIENT_FAILED:
      return 'Failed';
    default:
      throw new Error(`No friendly status for ${status}`);
  }
}

test('sending a reply', async function(assert) {
  await visit(`/agent/conversations/${this.case.id}`);

  this.pausePostsTo('/api/v1/cases/:id/reply');

  replyWith('Reply 1');
  replyWith('Reply 2');
  replyWith('Reply 3');

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Sending'],
    ['Reply 2', 'Waiting'],
    ['Reply 3', 'Waiting']
  ]);

  await this.resolveNextRequest();

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Sent'],
    ['Reply 2', 'Sending'],
    ['Reply 3', 'Waiting']
  ]);

  await this.resolveNextRequest();

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Sent'],
    ['Reply 2', 'Sent'],
    ['Reply 3', 'Sending']
  ]);

  await this.resolveNextRequest();

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Sent'],
    ['Reply 2', 'Sent'],
    ['Reply 3', 'Sent']
  ]);
});

test('resending a failed reply', async function(assert) {
  await visit(`/agent/conversations/${this.case.id}`);

  this.pausePostsTo('/api/v1/cases/:id/reply');

  replyWith('Reply 1');
  replyWith('Reply 2');

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Sending'],
    ['Reply 2', 'Waiting']
  ]);

  await this.rejectNextRequest();

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Failed'],
    ['Reply 2', 'Waiting']
  ]);

  replyWith('Reply 3');

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Failed'],
    ['Reply 2', 'Waiting'],
    ['Reply 3', 'Waiting']
  ]);

  resendFailedMessage('Reply 1');

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Sending'],
    ['Reply 2', 'Waiting'],
    ['Reply 3', 'Waiting']
  ]);

  await this.resolveNextRequest();
  await this.resolveNextRequest();
  await this.resolveNextRequest();

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Sent'],
    ['Reply 2', 'Sent'],
    ['Reply 3', 'Sent']
  ]);
});

test('when replies are in-flight, updates are disabled', async function(assert) {
  await visit(`/agent/conversations/${this.case.id}`);

  assert.ok(tagsFieldIsEnabled(), 'Tags field is enabled');

  this.pausePostsTo('/api/v1/cases/:id/reply');

  replyWith('Reply 1');

  assert.ok(tagsFieldIsDisabled(), 'Tags field is disabled');

  await this.resolveNextRequest();

  assert.ok(tagsFieldIsEnabled(), 'Tags field is re-enabled');
});

test('sending a combined reply and update', async function(assert) {
  await visit(`/agent/conversations/${this.case.id}`);
  await selectChoose('.qa-ko-case-content__status', 'Pending');

  this.pausePostsTo('/api/v1/cases/:id/reply');

  replyWith('Reply 1');

  assert.ok(replyBoxDisabled(), 'Reply box is disabled');

  await this.resolveNextRequest();

  assert.ok(replyBoxEnabled(), 'Reply box is enabled');

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Sent']
  ]);

  assert.equal(
    findWithAssert('.qa-ko-case-content__status input:first-of-type').val(),
    'Pending'
  );
});

test('sending a reply and dealing with validation failures', async function(assert) {
  await visit(`/agent/conversations/${this.case.id}`);

  this.pausePostsTo('/api/v1/cases/:id/reply');

  replyWith('Reply 1');

  await this.rejectNextRequest({
    status: 400,
    errors: [
      {
        code: 'FIELD_INVALID',
        parameter: 'status_id',
        message: 'The value of the field is invalid',
        more_info: 'https://developer.kayako.com/api/v1/reference/errors/FIELD_INVALID'
      }
    ]
  });

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Failed']
  ]);

  click('.qa-ko-case-content__status [role="button"]');
  click(findWithAssert(':contains("Pending")')[0]);
  click('.qa-ko-case-content__update-and-resend');

  await this.resolveNextRequest();

  assert.deepEqual(this.timelineState(), [
    ['Test message body', 'Delivered'],
    ['Reply 1', 'Sent']
  ]);
});

function replyBoxDisabled() {
  return !!find(`.${textEditorStyles.disabled}`).length;
}

function replyBoxEnabled() {
  return !replyBoxDisabled();
}

function tagsFieldIsDisabled() {
  return !!find('.qa-ko-case-content__tags [aria-disabled]').length;
}

function tagsFieldIsEnabled() {
  return !tagsFieldIsDisabled();
}

function replyWith(text) {
  run(() => fillInRichTextEditorSync(text));
  return click('.qa-case-content__submit');
}

function resendFailedMessage(text) {
  run(() => findWithAssert(`.ko-feed_item:contains("${text}") .qa-resend-button`).click());
}

function rejectRequest(request, payload) {
  let body = JSON.stringify(payload || {});
  run(() => request.resolve([500, { 'Content-Type': 'application/json' }, body]));

  // Wait until the tick after the next tick so we can ensure mirage has
  // already returned control to the app.
  return new Promise(resolve => run.next(() => run.next(resolve)));
}

function resolveRequest(request, { user }) {
  let { id: caseID } = request.params;
  let attrs = JSON.parse(request.requestBody);
  server.db.cases.update(caseID, {
    status: { resource_type: 'case_status', id: attrs.status_id }
  });
  let kase = server.db.cases.find(caseID);
  let resource = 'case_reply';
  let channel = server.db.channels.find(attrs.channel_id);
  let date = new Date();
  let message = server.create('case-message', {
    subject: attrs.contents,
    body_text: attrs.contents,
    body_html: attrs.contents,
    recipients: [],
    fullname: user.full_name,
    email: user.emails[0],
    creator: rel(user),
    identity: null,
    mailbox: null,
    created_at: date,
    updated_at: date
  });
  let post = server.create('post', {
    subject: message.subject,
    contents: message.body_html,
    creator: rel(user),
    identity: null,
    source_channel: rel(channel),
    original: rel(message),
    post_status: 'SENT',
    post_status_reject_type: null,
    post_status_reject_reason: null,
    created_at: date,
    updated_at: date
  });
  let data = {
    case: rel(kase),
    posts: [rel(post)],
    resource_type: 'case_reply'
  };
  let resources = gatherSideloadedResources(server.db, data);
  let headers = { 'Content-Type': 'application/json' };
  let status = 201;
  let payload = { status, resource, data, resources };
  let body = JSON.stringify(payload);

  run(() => request.resolve([status, headers, body]));

  // Wait until the tick after the next tick so we can ensure mirage has
  // already returned control to the app.
  return new Promise(resolve => run.next(() => run.next(() => run.next(resolve))));
}

function createAgent(server) {
  let domain = server.create('identity-domain', { domain: 'brewfictus.com',
    is_primary: true,
    is_validated: true
  });
  let organization = server.create('organization', {
    name: 'Brewfictus',
    domains: [rel(domain)],
  });
  let role = server.create('role', {
    title: 'Agent',
    type: 'AGENT',
    is_system: true,
    agent_case_access: 'ALL'
  });
  let team = server.create('team', {
    title: 'General',
    member_count: 1
  });
  let email = server.create('identity-email', {
    email: 'sienna@brewfictus.com',
    is_primary: true,
    is_validated: true,
    is_notification_enabled: true
  });
  let locale = server.create('locale', {
    locale: 'en-us',
    name: 'English',
    native_name: 'English (United States)',
    is_public: true
  });
  let result = server.create('user', {
    full_name: 'Sienna',
    role: rel(role),
    agent_case_access: 'ALL',
    organization_case_access: null,
    organization: rel(organization),
    teams: [rel(team)],
    emails: [rel(email)],
    phones: [],
    twitter: [],
    facebook: [],
    external_identifiers: [],
    custom_fields: [],
    locale: rel(locale),
    time_zone: 'UTC',
    time_zone_offset: 0,
    realtime_channel: 'presence-abc123@v1_users_1',
    presence_channel: 'user_presence-abc123',
    permissions: [],
    settings: []
  });

  return result;
}
