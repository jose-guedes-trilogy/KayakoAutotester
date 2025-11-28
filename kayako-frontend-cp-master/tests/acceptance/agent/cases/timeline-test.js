/* esl-disable new-cap */

import { app } from 'frontend-cp/tests/helpers/qunit';
import { test } from 'qunit';

import sinon from 'sinon';

import modeSelectorStyles from 'frontend-cp/components/ko-text-editor/mode-selector/styles';
import timelineItemStyles from 'frontend-cp/components/ko-timeline-2/list/item/styles';

let targetCase, identityEmail, agent;

app('Acceptance | Conversation | Timeline', {
  beforeEach() {
    const locale = server.create('locale', { locale: 'en-us' });
    const brand = server.create('brand', { locale });
    const caseFields = server.createList('case-field', 4);
    const mailbox = server.create('mailbox', { brand, is_default: true });
    const twitterAccount = server.create('twitter-account', { brand });
    const sourceChannel = server.create('channel', { account: mailbox });
    server.create('channel', { type: 'NOTE' });

    let twitterChannel = server.create('channel', { type: 'TWITTER', account: twitterAccount });
    let helpCenterChannel = server.create('channel', { type: 'HELPCENTER' });
    server.create('case-form', {
      fields: caseFields,
      brand: brand
    });
    const agentRole = server.create('role', { type: 'AGENT' });
    const customerRole = server.create('role', { type: 'CUSTOMER' });
    agent = server.create('user', { role: agentRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    const customer = server.create('user', { full_name: 'Barney Stinson', role: customerRole, locale: locale, time_zone: 'Europe/London' });
    identityEmail = server.create('identity-email');
    server.createList('case-status', 5);
    server.createList('case-priority', 4);
    server.createList('attachment', 3);

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    const status = server.create('case-status');
    targetCase = server.create('case', {
      source_channel: sourceChannel,
      requester: customer,
      creator: agent,
      identity: identityEmail,
      status: status,
      assignee: {
        agent
      }
    });

    const caseMessage = server.create('case-message');

    const posts = server.createList('post', 3, {
      creator: customer,
      identity: identityEmail,
      original: { id: caseMessage.id, resource_type: 'case_message' },
      source_channel: sourceChannel,
      post_status: 'DELIVERED',
      case_id: targetCase.id
    });

    posts.forEach(post => server.create('email-original', { id: post.id }));

    const twitterTweet = server.create('twitter-tweet');

    this.tweet = server.create('post', {
      creator: agent,
      identity: identityEmail,
      original: twitterTweet,
      source_channel: twitterChannel,
      post_status: 'DELIVERED',
      case_id: targetCase.id
    });

    server.create('post', {
      creator: agent,
      identity: identityEmail,
      original: caseMessage,
      source_channel: helpCenterChannel,
      post_status: 'DELIVERED',
      case_id: targetCase.id
    });

    login(session.id);

  },

  afterEach() {
    logout();
    targetCase = null;
  }
});

test('it shows messages, notes and attachments', function(assert) {
  visit(`/agent/conversations/${targetCase.id}`);

  andThen(function() {
    assert.equal(find('.qa-feed_item--post').length, 3, 'There is three posts');
  });
});

test('posts have a link to the original message', function(assert) {
  assert.expect(3);

  sinon.stub(window, 'open');

  visit(`/agent/conversations/${targetCase.id}`);

  andThen(function() {
    click('.qa-feed_item--post:first .qa-created-at-email-link');
  });

  andThen(function() {
    assert.equal(find('.qa-subject').text().trim(), 'Re: Please help me', 'Original email modal displayed');
  });

  andThen(function() {
    click('.qa-feed_item--twitter-post:first .qa-created-at-twitter-link');
  });

  andThen(() => {
    let screenName = this.tweet.original.screen_name;
    let id = this.tweet.original.id;

    assert.ok(window.open.calledWithMatch(`https://twitter.com/${screenName}/status/${id}`), 'Link to original tweet');
    window.open.restore();
  });

  andThen(function() {
    assert.equal(find('.qa-feed_item--helpcenter-post:first .qa-created-at-string').length, 1, 'Help Center post does not link to original');
  });
});

test('add replies', function(assert) {
  visit(`/agent/conversations/${targetCase.id}`);

  andThen(function() {
    assert.equal(find('.qa-feed_item--post').length, 3, 'There is three posts');
    fillInRichTextEditor('Testing replies');
  });

  andThen(function() {
    click('.qa-case-content__submit');
  });

  andThen(function() {
    assert.equal(find('.qa-feed_item--post').length, 4, 'There is four posts now');
    assert.equal(find('.qa-feed_item--post:eq(3) .ko-feed_item__content').text().trim(), 'Testing replies', 'The added post is in the top');
  });
});

test('add notes', function(assert) {
  assert.expect(5);

  visit(`/agent/conversations/${targetCase.id}`);

  andThen(function() {
    assert.equal(find('.qa-feed_item--post').length, 3, 'There is three posts');
    assert.equal(find('.ko-feed_item').length, 5, 'There are five items');
  });

  click(`.${modeSelectorStyles.root}`);
  fillInRichTextEditor('Testing notes');
  andThen(() => {});
  click('.qa-case-content__submit');

  andThen(function() {
    assert.equal(find('.qa-feed_item--post').length, 3, 'There is still 3 posts');
    assert.equal(find('.ko-feed_item').length, 6, 'There are six items now');
    assert.equal(find('.ko-feed_item:eq(5) .ko-feed_item__content').text().trim(), 'Testing notes', 'The added note is in the bottom');
  });
});

test('add note to user and pin it', async function(assert) {
  await visit(`/agent/conversations/${targetCase.id}`);

  assert.equal(find('.qa-feed_item--post').length, 3, 'There is three posts');
  assert.equal(find('.ko-feed_item').length, 5, 'There are five items');

  click(`.${modeSelectorStyles.root}`);
  await fillInRichTextEditor('Testing notes');
  click('.qa-note-destination--user .qa-note-destination--radio');
  await click('.qa-case-content__submit');

  assert.equal(find('.qa-feed_item--post').length, 3, 'There is still 3 posts');
  assert.equal(find('.ko-feed_item').length, 6, 'There are six items now');
  assert.equal(find('.ko-feed_item:eq(5) .ko-feed_item__content').text().trim(), 'Testing notes', 'The added note is in the bottom');

  await click('.qa-pin-timeline-note');

  assert.ok(find(`.${timelineItemStyles.note}`).hasClass(timelineItemStyles.pinned), 'note item was pinned');
  assert.ok(find('.qa-pinned-note-count').text().includes('1'), 'Sidebar contains the right pinned note count');
});
