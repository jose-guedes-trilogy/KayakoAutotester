import EmberObject from '@ember/object';
import { getOwner } from '@ember/application';
import { moduleFor, test } from 'ember-qunit';
import mirage from 'frontend-cp/tests/helpers/setup-mirage-for-integration';
import { createAdmin } from 'frontend-cp/mirage/scenarios/users';
import { caseNote } from 'frontend-cp/mirage/scenarios/posts-all-permutations';
import { createCaseWithoutAnyPosts } from 'frontend-cp/mirage/scenarios/cases';
import Timeline from 'frontend-cp/timelines/post';
import { run } from '@ember/runloop';
import RSVP from 'rsvp';

const { Promise } = RSVP;

let adminUser, caseId;

moduleFor('timeline', 'Unit | Timeline object', {
  integration: true,

  setup: function() {
    /* eslint-disable no-undef, camelcase */
    mirage(getOwner(this));

    let kase = createCaseWithoutAnyPosts(server);
    caseId = kase.id;

    let billMurrayDotCom = server.create('organization', {
      domains: [
        server.create('identity-domain', {
          domain: 'billmurray.com'
        })
      ],
      metadata: server.create('metadata'),
      tags: server.createList('tag', 2)
    });

    adminUser = createAdmin(server, 'Bill Murray', billMurrayDotCom);

    let loop = new Array(30).fill();
    loop.forEach(() => {
      return caseNote(server, adminUser, caseId);
    });

    /* eslint-enable no-undef, camelcase */
  },

  teardown: function() {
    server.shutdown();
  }
});

test('it should return the most recent part of the conversation', function(assert) {
  assert.expect(4);

  let store = getOwner(this).lookup('service:store');

  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return run(() => testTimeline.get('fetchMostRecent').perform()).then(() => {
    assert.equal(testTimeline.get('posts.length'), 10, 'posts returned', 'posts returned');

    assert.equal(testTimeline.get('firstPost.id'), 21, 'oldest post id', 'oldest post id');

    assert.equal(testTimeline.get('lastPost.id'), 30, 'newest post id', 'newest post id');

    assert.equal(testTimeline.get('moreNewerPosts'), false, 'more newer posts');
  });
});

test('it should fetch posts older the oldest post previously fetched', function(assert) {
  assert.expect(3);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return Promise.resolve()
    .then(() => run(() => testTimeline.get('fetchMostRecent').perform()))
    .then(() => run(() => testTimeline.get('fetchOlder').perform()))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 20, 'posts returned');

      assert.equal(testTimeline.get('firstPost.id'), 11, 'oldest post id');

      assert.equal(testTimeline.get('lastPost.id'), 30, 'newest post id');
    });
});

test('it should fetch posts around the post specified', function(assert) {
  assert.expect(3);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return run(() => testTimeline.get('fetchPosition').perform({ postId: 20 }))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 10, 'posts returned');

      assert.equal(testTimeline.get('firstPost.id'), 16, 'oldest post id');

      assert.equal(testTimeline.get('lastPost.id'), 25, 'newest post id');
    });
});

test('it should fetch posts newer than the newest post previously fetched', function(assert) {
  assert.expect(3);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return Promise.resolve()
    .then(() => run(() => testTimeline.get('fetchPosition').perform({ postId: 15 })))
    .then(() => run(() => testTimeline.get('fetchNewer').perform()))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 20, 'posts returned');

      assert.equal(testTimeline.get('firstPost.id'), 11, 'oldest post id');

      assert.equal(testTimeline.get('lastPost.id'), 30, 'newest post id');
    });
});

test('it should confirm if all posts are loaded', function(assert) {
  assert.expect(4);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 30,
    store
  });

  return run(() => testTimeline.get('fetchMostRecent').perform())
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 30, 'posts returned');

      assert.equal(testTimeline.get('allPostsLoaded'), true, 'all posts loaded');
      assert.equal(testTimeline.get('moreNewerPosts'), false, 'more newer posts');
      assert.equal(testTimeline.get('moreOlderPosts'), false, 'more older posts');
    });
});

test('it should confirm if all posts have not been loaded', function(assert) {
  assert.expect(2);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 29,
    store
  });

  return run(() => testTimeline.get('fetchMostRecent').perform())
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 29, 'posts returned');
      assert.equal(testTimeline.get('allPostsLoaded'), false, 'all posts loaded');
    });
});

test('it should confirm if a post id has already been fetched', function(assert) {
  assert.expect(4);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return run(() => testTimeline.get('fetchMostRecent').perform())
    .then(() => {
      assert.equal(testTimeline.containsPostId(30), true, 'post id has been fetched');
      assert.equal(testTimeline.containsPostId('30'), true, 'post id has been fetched');
      assert.equal(testTimeline.containsPostId(31), false, 'post id has been fetched');
      assert.equal(testTimeline.containsPostId('31'), false, 'post id has been fetched');
    });
});

test('it should confirm if there are older posts to load after loading the most recent', function(assert) {
  assert.expect(4);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return run(() => testTimeline.get('fetchMostRecent').perform())
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 10, 'posts returned');

      assert.equal(testTimeline.get('firstPost.id'), 21, 'oldest post id');

      assert.equal(testTimeline.get('lastPost.id'), 30, 'newest post id');

      assert.equal(testTimeline.get('moreOlderPosts'), true, 'more older posts');
    });
});

test('it should confirm if there are NOT older posts to load after loading the most recent', function(assert) {
  assert.expect(4);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 31,
    store
  });

  return run(() => testTimeline.get('fetchMostRecent').perform())
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 30, 'posts returned');

      assert.equal(testTimeline.get('firstPost.id'), 1, 'oldest post id');

      assert.equal(testTimeline.get('lastPost.id'), 30, 'newest post id');

      assert.equal(testTimeline.get('moreOlderPosts'), false, 'more older posts');
    });
});

test('it should confirm if there are older posts to load after loading a position', function(assert) {
  assert.expect(4);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return run(() => testTimeline.get('fetchPosition').perform({ postId: 20 }))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 10, 'posts returned');

      assert.equal(testTimeline.get('firstPost.id'), 16, 'oldest post id');

      assert.equal(testTimeline.get('lastPost.id'), 25, 'newest post id');

      assert.equal(testTimeline.get('moreOlderPosts'), true, 'more older posts');
    });
});

test('it should confirm if there are NOT older posts to load after loading a position', function(assert) {
  assert.expect(4);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return run(() => testTimeline.get('fetchPosition').perform({ postId: 4 }))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 9, 'posts returned');

      assert.equal(testTimeline.get('firstPost.id'), 1, 'oldest post id');

      assert.equal(testTimeline.get('lastPost.id'), 9, 'newest post id');

      assert.equal(testTimeline.get('moreOlderPosts'), false, 'more older posts');
    });
});

test('it should confirm if there are newer posts to load after loading a position', function(assert) {
  assert.expect(4);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return run(() => testTimeline.get('fetchPosition').perform({ postId: 20 }))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 10, 'posts returned');

      assert.equal(testTimeline.get('firstPost.id'), 16, 'oldest post id');

      assert.equal(testTimeline.get('lastPost.id'), 25, 'newest post id');

      assert.equal(testTimeline.get('moreNewerPosts'), true, 'more newer posts');
    });
});

test('it should confirm if there are NOT newer posts to load after loading a position', function(assert) {
  assert.expect(4);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return run(() => testTimeline.get('fetchPosition').perform({ postId: 26 }))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 9, 'posts returned');

      assert.equal(testTimeline.get('firstPost.id'), 22, 'oldest post id');

      assert.equal(testTimeline.get('lastPost.id'), 30, 'newest post id');

      assert.equal(testTimeline.get('moreNewerPosts'), false, 'more newer posts');
    });
});

test('it should confirm if there are newer posts to load after loading a position and fetching newer posts', function(assert) {
  assert.expect(4);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return Promise.resolve()
    .then(() => run(() => testTimeline.get('fetchPosition').perform({ postId: 15 })))
    .then(() => run(() => testTimeline.get('fetchNewer').perform()))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 20, 'posts returned');

      assert.equal(testTimeline.get('firstPost.id'), 11, 'oldest post id');

      assert.equal(testTimeline.get('lastPost.id'), 30, 'newest post id');

      assert.equal(testTimeline.get('moreNewerPosts'), true, 'more newer posts');
    });
});

test('it should confirm if there are NOT newer posts to load after loading a position and fetching newer posts', function(assert) {
  assert.expect(4);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return Promise.resolve()
    .then(() => run(() => testTimeline.get('fetchPosition').perform({ postId: 20 })))
    .then(() => run(() => testTimeline.get('fetchNewer').perform()))
    .then(() => {
      assert.equal(testTimeline.get('posts.length'), 15, 'posts returned');

      assert.equal(testTimeline.get('firstPost.id'), 16, 'oldest post id');

      assert.equal(testTimeline.get('lastPost.id'), 30, 'newest post id');

      assert.equal(testTimeline.get('moreNewerPosts'), false, 'more newer posts');
    });
});

test('when restoring timeline, moreNewPosts remains true', function(assert) {
  assert.expect(2);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return Promise.resolve()
    .then(() => run(() => testTimeline.get('fetchPosition').perform({ postId: 10 })))
    .then(() => {
      assert.equal(testTimeline.get('moreNewerPosts'), true, 'more newer posts');
    })
    .then(() => run(() => testTimeline.get('restore').perform()))
    .then(() => {
      assert.equal(testTimeline.get('moreNewerPosts'), true, 'more newer posts');
    });
});

test('when restoring timeline, moreNewPosts remains false', function(assert) {
  assert.expect(2);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return Promise.resolve()
    .then(() => run(() => testTimeline.get('fetchPosition').perform({ postId: 30 })))
    .then(() => {
      assert.equal(testTimeline.get('moreNewerPosts'), false, 'more newer posts');
    })
    .then(() => run(() => testTimeline.get('restore').perform()))
    .then(() => {
      assert.equal(testTimeline.get('moreNewerPosts'), false, 'more newer posts');
    });
});

test('when restoring timeline, moreNewPosts is update from false to true', function(assert) {
  assert.expect(2);

  let store = getOwner(this).lookup('service:store');
  let testTimeline = Timeline.create({
    parent: EmberObject.create({
      id: caseId,
      constructor: {
        modelName: 'case'
      }
    }),
    limit: 10,
    store
  });

  return Promise.resolve()
    .then(() => run(() => testTimeline.get('fetchPosition').perform({ postId: 30 })))
    .then(() => {
      assert.equal(testTimeline.get('moreNewerPosts'), false, 'more newer posts');
    })
    .then(() => caseNote(server, adminUser, caseId))
    .then(() => run(() => testTimeline.get('restore').perform()))
    .then(() => {
      assert.equal(testTimeline.get('moreNewerPosts'), true, 'more newer posts');
    });
});
