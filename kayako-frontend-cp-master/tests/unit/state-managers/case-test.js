import { module, test } from 'qunit';
import EmberObject from '@ember/object';
import CaseStateManager from 'frontend-cp/state-managers/case';

const QuietCaseStateManager = CaseStateManager.extend({
  init() {},
  persistTabState() {}
});

module('state-managers/case');

test('isContentEdited', function(assert) {
  let subject = QuietCaseStateManager.create();

  subject.set('postContent', '');
  assert.equal(subject.get('isContentEdited'), false,
    'false with the empty string');

  subject.set('postContent', ' ');
  assert.equal(subject.get('isContentEdited'), false,
    'false with just space');

  subject.set('postContent', '&nbsp;');
  assert.equal(subject.get('isContentEdited'), false,
    'false with just non-breaking space');

  subject.set('postContent', '<br>');
  assert.equal(subject.get('isContentEdited'), false,
    'false with just <br>');

  subject.set('postContent', '<p>&nbsp;<br>&nbsp;</p>');
  assert.equal(subject.get('isContentEdited'), false,
    'false with a mix of html but no perceivable characters');

  subject.set('postContent', '<img src="foo.jpg">');
  assert.equal(subject.get('isContentEdited'), true,
    'true with <img>');

  subject.set('postContent', 'a');
  assert.equal(subject.get('isContentEdited'), true,
    'true with any perceivable characters');
});

test('inferStateFromLatestPosts', function(assert) {
  let subject = QuietCaseStateManager.create({
    model: mockTwitterCase(),
    publicChannelId: 'twitter',
    replyOptions: {},
    launchDarkly: mockLaunchDarkly()
  });

  // Set the intial reply type and allow overrides
  subject.setTwitterType('REPLY');

  assert.equal(
    subject.get('replyOptions.type'),
    'REPLY',
    'sets replyOptions.type to REPLY');

  // Infer state from a DM
  subject.inferStateFromLatestPosts([mockPostWithType('twitterMessage')]);

  assert.equal(
    subject.get('replyOptions.type'),
    'DM',
    'sets replyOptions.type to DM');

  // Infer state from a public tweet
  subject.inferStateFromLatestPosts([mockPostWithType('twitterTweet')]);

  assert.equal(
    subject.get('replyOptions.type'),
    'REPLY',
    'sets replyOptions.type to REPLY');

  // Set reply type explicitly (i.e. using the select in the composer)
  subject.setTwitterType('DM');

  // Infer state from a public tweet
  subject.inferStateFromLatestPosts([mockPostWithType('twitterTweet')]);

  assert.equal(
    subject.get('replyOptions.type'),
    'REPLY',
    'changes replyOptions.type REPLY');

  // Finally, test what happens when the selected channel has nothing to do
  // with Twitter
  subject.set('model', mockMailCase());
  subject.set('publicChannelId', 'mail');

  subject.setTwitterType('foo');

  subject.inferStateFromLatestPosts([mockPostWithType('twitterTweet')]);

  assert.equal(
    subject.get('replyOptions.type'),
    'foo',
    'leaves replyOptions.type alone');
});

function mockTwitterCase() {
  return EmberObject.create({
    replyChannels: [EmberObject.create({
      id: 'twitter',
      channelType: 'TWITTER'
    })],
  });
}

function mockPostWithType(postType) {
  return EmberObject.create({
    original: EmberObject.create({
      postType,
      isMessage: true
    })
  });
}

function mockMailCase() {
  return EmberObject.create({
    replyChannels: [EmberObject.create({
      id: 'mail',
      channelType: 'MAIL'
    })],
  });
}

function mockLaunchDarkly() {
  return EmberObject.create({
    'release-infer-twitter-reply-type': true,

    variation(key) {
      return key === 'release-infer-twitter-reply-type';
    }
  });
}
