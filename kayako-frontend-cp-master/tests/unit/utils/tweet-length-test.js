import tweetLength from 'frontend-cp/utils/tweet-length';
import { module, test } from 'qunit';

module('Unit | Utility | tweet length');

// plain tweet (no links, no files)
test('get length for a tweet', function(assert) {
  const tweet = 'Hello, I am trying to say something';
  let result = tweetLength(tweet, false);
  assert.equal(result, tweet.length);
});

// plain tweet with files
test('get length for a tweet with files', function(assert) {
  const tweet = 'Hello, I am trying to say something';
  let result = tweetLength(tweet, true);
  assert.equal(result, (tweet.length + 24));
});

// plain tweet with link(s)
test('get length for a tweet with http links', function(assert) {
  const tweet = 'Hello, I am trying to say something';
  const link = 'http://google.com';
  let result = tweetLength(`${tweet} ${link}`, false);
  assert.equal(result, (tweet.length + 24));
});

// plain tweet with https link(s)
test('get length for a tweet with https links', function(assert) {
  const tweet = 'Hello, I am trying to say something';
  const link = 'https://google.com';
  let result = tweetLength(`${tweet} ${link}`, false);
  assert.equal(result, (tweet.length + 24));
});

// plain tweet with https wrapped link(s)
test('get length for a tweet with link wrapped in anchor tag', function(assert) {
  const tweet = 'Hello, I am trying to say something';
  const link = '<a href="https://google.com">https://google.com</a>';
  let result = tweetLength(`${tweet} ${link}`, false);
  assert.equal(result, (tweet.length + 24));
});

// plain tweet with both files and links
test('get length for a tweet with link wrapped in anchor tag', function(assert) {
  const tweet = 'Hello, I am trying to say something';
  const link = '<a href="https://google.com">https://google.com</a>';
  let result = tweetLength(`${tweet} ${link}`, true);
  assert.equal(result, (tweet.length + 24 + 24));
});
