import EmberObject from '@ember/object';
import { getOwner } from '@ember/application';
import { moduleFor, test } from 'ember-qunit';
import mirage from 'frontend-cp/tests/helpers/setup-mirage-for-integration';
import Timeline from 'frontend-cp/timelines/post';
import { run } from '@ember/runloop';
import RSVP from 'rsvp';
import { createCaseWithoutAnyPosts } from 'frontend-cp/mirage/scenarios/cases';

const { Promise } = RSVP;

let testTimeline;

moduleFor('timeline', 'Unit | Timeline empty states object', {
  integration: true,

  setup: function() {
    /* eslint-disable no-undef, camelcase */
    mirage(getOwner(this));

    let kase = createCaseWithoutAnyPosts(server);
    let caseId = kase.id;
    let store = getOwner(this).lookup('service:store');
    testTimeline = Timeline.create({
      parent: EmberObject.create({
        id: caseId,
        constructor: {
          modelName: 'case'
        }
      }),
      limit: 10,
      store
    });
    /* eslint-enable no-undef, camelcase */
  },

  teardown: function() {
    server.shutdown();
  }
});

test('it should handle no posts being returned when fetching the most recent', function(assert) {
  assert.expect(4);

  return run(() => testTimeline.get('fetchMostRecent').perform())
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 0, 'posts returned');

      assert.equal(testTimeline.get('oldestPostId'), null, 'oldest post id');

      assert.equal(testTimeline.get('newestPostId'), null, 'newest post id');

      assert.equal(testTimeline.get('allPostsLoaded'), true, 'all posts loaded');
    });
});

test('it should handle no posts being returned when fetching posts older than the ones previously loaded', function(assert) {
  assert.expect(4);

  return Promise.resolve()
    .then(() => run(() => testTimeline.get('fetchMostRecent').perform()))
    .then(() => run(() => testTimeline.get('fetchOlder').perform()))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 0, 'posts returned');

      assert.equal(testTimeline.get('oldestPostId'), null, 'oldest post id');

      assert.equal(testTimeline.get('newestPostId'), null, 'newest post id');

      assert.equal(testTimeline.get('allPostsLoaded'), true, 'all posts loaded');
    });
});

test('when fetching posts around a post it should handle no posts being returned when fetching the posts newer than the one specified', function(assert) {
  assert.expect(4);

  return run(() => testTimeline.get('fetchPosition').perform(20))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 0, 'posts returned');

      assert.equal(testTimeline.get('oldestPostId'), null, 'oldest post id');

      assert.equal(testTimeline.get('newestPostId'), null, 'newest post id');

      assert.equal(testTimeline.get('allPostsLoaded'), true, 'all posts for');
    });
});

test('it should handle no posts being returned when fetching posts newer than the ones previously loaded', function(assert) {
  assert.expect(4);

  return Promise.resolve()
    .then(() => run(() => testTimeline.get('fetchMostRecent').perform()))
    .then(() => run(() => testTimeline.get('fetchNewer').perform()))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 0, 'posts returned');

      assert.equal(testTimeline.get('oldestPostId'), null, 'oldest post id');

      assert.equal(testTimeline.get('newestPostId'), null, 'newest post id');

      assert.equal(testTimeline.get('allPostsLoaded'), true, 'all posts for');
    });
});
