import { app } from 'frontend-cp/tests/helpers/qunit';
import { test } from 'qunit';
import { assign } from '@ember/polyfills';

app('Acceptance | Conversation | Replying to a Facebook message', {
  beforeEach() {
    this.agent = createAgent();
    this.case = createCase();

    let session = server.create('session', { user: this.agent });

    login(session.id);
    visit(`/agent/conversations/${this.case.id}`);
  },

  afterEach() {
    logout();
  }
});

test('using the channel selector', function(assert) {
  andThen(() => {
    selectChoose('.qa-post__channel-selector', 'Brewfictus - Message');
  });

  andThen(() => {
    fillInRichTextEditor('An answer via Facebook');
  });

  andThen(() => {
    click('.qa-case-content__submit');
  });

  // Assert we sent the correct data
  server.post(`/api/v1/cases/${this.case.id}/reply`, (schema, req) => {
    verifyRequest(assert, req, this);
    return createResponse(req, this);
  });

  // Assert we rendered the correct result
  andThen(() => {
    let item = findWithAssert('.ko-feed_item:last');
    let content = item.find('.ko-feed_item__content');
    let subtitle = item.find('.qa-ko-timeline_item__subtitle');

    assert.equal(find('.ko-feed_item:contains("An answer via Facebook")').length, 1,
      'does not duplicate sent and timeline posts');
    assert.equal(content.text().trim(), 'An answer via Facebook');
    assert.equal(subtitle.text().trim(), 'via Facebook');
  });
});

test('using the inline reply button', function(assert) {
  andThen(() => {
    triggerEvent('.ko-feed_item:first', 'mouseenter');
    click('.qa-ko-timeline_item_menu__reply');
    fillInRichTextEditor('An answer via Facebook');
  });

  andThen(() => {
    click('.qa-case-content__submit');
  });

  // Assert we sent the correct data
  server.post(`/api/v1/cases/${this.case.id}/reply`, (schema, req) => {
    verifyRequest(assert, req, this, {
      in_reply_to_uuid: this.case.posts[0].uuid
    });
    return createResponse(req, this);
  });

  // Assert we rendered the correct result
  andThen(() => {
    let item = findWithAssert('.ko-feed_item:last');
    let content = item.find('.ko-feed_item__content');
    let subtitle = item.find('.qa-ko-timeline_item__subtitle');

    assert.equal(content.text().trim(), 'An answer via Facebook');
    assert.equal(subtitle.text().trim(), 'via Facebook');
  });
});

// Fixtures

const FACEBOOK_PAGE = 'Brewfictus';
const CUSTOMER_NAME = 'Caryn Pryor';
const AGENT_NAME = 'Jordan Mitchell';

function createAgent() {
  let name = AGENT_NAME;
  let role = server.create('role', { type: 'AGENT' });
  let locale = server.create('locale');
  let identity = server.create('identity-facebook', { full_name: name });
  let agent = server.create('user', {
    full_name: name,
    role,
    locale,
    facebook: [identity],
    time_zone: 'Europe/London'
  });

  server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });

  return agent;
}

function createCase() {
  let customer = createCustomer();
  let identity = customer.facebook[0];
  let channel = createChannel();
  let status = server.create('case-status');
  const mailbox = server.create('mailbox', { is_default: true });
  server.create('channel', { account: { id: mailbox.id, resource_type: 'mailbox' } });
  let kase = server.create('case', {
    source_channel: channel,
    creator: customer,
    requester: customer,
    identity,
    status
  });
  let facebookMessage = server.create('facebook-message', {
    uuid: 'adddf2fc-8113-4f4b-9c71-40d4a2f44a5b'
  });
  let post = server.create('post', {
    contents: 'A question via Facebook',
    creator: customer,
    requester: customer,
    identity,
    source_channel: channel,
    original: { id: facebookMessage.id, resource_type: 'facebook_message' },
    case_id: kase.id
  });

  kase.posts = [post];

  return kase;
}

function createCustomer() {
  let name = CUSTOMER_NAME;
  let role = server.create('role', { type: 'CUSTOMER' });
  let identity = server.create('identity-facebook', { full_name: name });
  let customer = server.create('user', {
    full_name: name,
    role,
    facebook: [identity],
    time_zone: 'Europe/London'
  });

  return customer;
}

function createChannel() {
  let title = FACEBOOK_PAGE;
  let account = server.create('facebook-account', { title });
  let channel = server.create('channel', { type: 'FACEBOOK', account });

  channel.id = channel.uuid;

  return channel;
}

function verifyRequest(assert, req, context, fields) {
  let actualPayload = JSON.parse(req.requestBody);

  // Rather than stubbing the client_id, we’ll skip it.  We assert in the
  // case-reply unit test that this is generated correctly so there’s no need
  // to re-assert here.
  Reflect.deleteProperty(actualPayload, 'client_id');

  let expectedPayload = assign({
    contents: 'An answer via Facebook',
    channel: 'FACEBOOK',
    channel_id: context.case.source_channel.account.id,
    subject: 'ERS Audit 1',
    requester_id: '2',
    in_reply_to_uuid: null,
    status_id: '1',
    priority_id: null,
    type_id: null,
    assigned_team_id: null,
    assigned_agent_id: null,
    tags: '',
    form_id: null,
    field_values: {},
    attachment_file_ids: ''
  }, fields);

  assert.deepEqual(actualPayload, expectedPayload);
}

function createResponse(req, context) {
  let attrs = JSON.parse(req.requestBody);

  let facebookMessage = {
    id: 22,
    uuid: 'adddf2fc-8113-4f4b-9c71-40d4a2f44a5b',
    resource_type: 'facebook_message'
  };

  let post = {
    id: 71,
    client_id: attrs.client_id,
    uuid: 'adddf2fc-8113-4f4b-9c71-40d4a2f44a5b',
    contents: 'An answer via Facebook',
    post_status: 'DELIVERED',
    creator: { id: context.agent.id, resource_type: 'user' },
    identity: { id: context.agent.facebook[0].id, resource_type: 'identity_facebook' },
    source_channel: { id: context.case.source_channel.uuid, resource_type: 'channel' },
    original: { id: facebookMessage.id, resource_type: 'facebook_message' },
    created_at: new Date(),
    updated_at: new Date(),
    resource_url: '/api/v1/cases/posts/71'
  };

  let reply = {
    resource_type: 'case_reply',
    posts: [{ id: post.id, resource_type: 'post' }],
    case: { id: context.case.id, resource_type: 'case' }
  };

  let response = {
    data: reply,
    resource: 'case_reply',
    resources: {
      case: { [context.case.id]: context.case },
      post: { [post.id]: post },
      facebook_message: { [facebookMessage.id]: facebookMessage }
    }
  };

  server.create('facebook-message', facebookMessage);
  server.create('post', post);

  return response;
}
