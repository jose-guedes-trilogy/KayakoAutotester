import Timeline from './timeline';

import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { task } from 'ember-concurrency';
import { assign } from '@ember/polyfills';
import object from '@ember/object';
import { inject as service } from '@ember/service';

export default Timeline.extend({
  readMarker: null,
  filter: null,

  /**
   * Sent posts are ones which we have received from the API independently
   * of the timeline. Typically from a POST to `/api/v1/cases/:id/reply`.
   *
   * They are complete posts with all properties accounted for, we just
   * don’t yet know where they should appear in the timeline.
   *
   * We expect that at some later point the post will appear in the reponse
   * to `/api/v1/cases/:id/posts`, take its place in the timeline,
   * and can be safely removed from sentPosts (or simply ignored).
   *
   * Posts are added to this array with {@link addSentPosts}.
   *
   * @property sentPosts
   * @type Post[]
   */
  sentPosts: null,
  sendingOperations: null,

  firstPost: reads('posts.firstObject'),
  lastPost: reads('posts.lastObject'),

  plan: service(),

  init() {
    this._super(...arguments);

    this.set('sentPosts', []);
    this.set('sendingOperations', []);
  },

  /**
   * @method addSentPosts
   * @param {Post[]} posts
   */
  addSentPosts(posts) {
    this.get('sentPosts').addObjects(posts);
    this.trigger('didAddSentPosts');
  },

  addSendingOperation(op) {
    this.get('sendingOperations').addObject(op);
    this.trigger('didAddSendingOperation');
  },

  notifySendingOperationUpdate(op) {
    this.trigger('didUpdateSendingOperation', op);
  },

  setFilter(filter) {
    if (this.get('filter') === filter) {
      return;
    }

    this.set('filter', filter);
    this.get('loadMostRecent').perform();
  },

  allPostsLoaded: computed('posts', 'serverTotalPosts', function() {
    let { posts, serverTotalPosts } = this.getProperties('posts', 'serverTotalPosts');

    return posts.length === serverTotalPosts;
  }),

  lastReadPost: computed('posts.[]', 'readMarker', function() {
    let post = this._lastReadPost();
    let unreadPosts = this._unreadPosts();
    let messages = unreadPosts.filter(isMessage);

    if (messages.length) {
      return post;
    } else {
      return null;
    }
  }),

  lastMessage: computed('moreNewerPosts', 'posts.[]', function() {
    if (this.get('moreNewerPosts')) {
      return;
    }

    return this.get('posts').slice().reverse().find(isMessage);
  }),

  lastMessageFromACustomer: computed('moreNewerPosts', 'posts.[]', function() {
    if (this.get('moreNewerPosts')) {
      return;
    }

    return this.get('posts').slice().reverse().find(isMessageFromCustomer);
  }),

  newestUnreadPost() {
    let unreadPosts = this._unreadPosts();

    return unreadPosts.reverse().find(isMessage);
  },

  fetchNewerFromKRE: task(function * () {
    this.trigger('willFetchNewerFromKRE');
    yield this.get('_fetchNewer').perform();
    this.trigger('didFetchNewerFromKRE');
  }),

  loadPosition: task(function * ({ postId, noteId }) {
    this.clear();
    if (postId) {
      yield this.get('fetchPosition').perform({ postId });
    }
    else if (noteId) {
      yield this.get('fetchPosition').perform({ noteId });
    }
  }),

  fetchPosition: task(function * ({ postId, noteId }) {
    const isNote = Boolean(noteId);
    const store = this.get('store');
    let expectedNumberOfPosts = Math.round(this.get('limit') / 2);

    let afterParams, afterData;
    if (postId) {
      afterParams = this._paramsForAfterPost(postId, expectedNumberOfPosts);
      afterData = yield this.get('_fetch').perform(afterParams);
    }
    else if (isNote) {
      afterData = yield store.adapterFor('note').getNoteSource('cases', this.get('parent.id'), noteId, expectedNumberOfPosts);
    }

    if (afterData && (afterData.data || afterData).toArray().length) {
      let firstAfterPost;
      if (isNote) {
        firstAfterPost = this.sortNotes(afterData.data || afterData, 'ASC')[0];
        firstAfterPost = object.create(firstAfterPost);
      } else {
        firstAfterPost = this.sortPosts(afterData.data || afterData, 'ASC')[0];
      }
      let beforeParams = this._paramsForBeforePost(firstAfterPost.get('id'), expectedNumberOfPosts);
      let beforeData = yield this.get('_fetch').perform(beforeParams);

      let total = afterData.total_count || afterData.meta.total_count;

      if (isNote) {
        store.pushPayload(afterData);
        afterData = afterData.posts.map(({ id }) => store.peekRecord('post', id));
      }

      this._updateInternalState(afterData, total, 'NEWER', expectedNumberOfPosts);
      this._updateInternalState(beforeData, total, 'OLDER', expectedNumberOfPosts);
    } else {
      // If there's nothing after the position we're requesting, we're at the end so just fetch most recent
      let params = this._paramsForMostRecent();
      let data = yield this.get('_fetch').perform(params);
      this._updateInternalState(data, data.meta.total, 'NONE');
    }

    this.trigger('didFetchPosition', { postId, noteId });
  }),

  storeLocalReadState() {
    let post = this._findPostForLocalReadState();
    let id = post && post.get('id') || this.get('parent.readMarker.lastReadPostId');

    this.set('readMarker', id);
  },

  clearLocalReadState() {
    this.set('readMarker', null);
  },

  updateRemoteReadState: task(function * () {
    let post = this.newestUnreadPost();

    if (!post) {
      return;
    }

    let adapter = this.get('store').adapterFor('post');

    yield adapter.markAsSeen(post);

    if (this.get('parent.canReload')) {
      yield this.get('parent').reload();
    }
  }).restartable(),

  markAllAsSeen: task(function * () {
    this.set('readMarker', null);
    yield this.get('updateRemoteReadState').perform();
  }).restartable(),

  sortPosts(posts, dir = 'ASC') {
    return posts.toArray().sort((a, b) => {
      if (dir === 'ASC') {
        if (a.get('createdAt').getTime() === b.get('createdAt').getTime()) {
          return parseInt(a.id) - parseInt(b.id);
        }
        else {
          return a.get('createdAt').getTime() - b.get('createdAt').getTime();
        }
      } else {
        if (a.get('createdAt').getTime() === b.get('createdAt').getTime()) {
          return parseInt(b.id) - parseInt(a.id);
        }
        else {
          return b.get('createdAt').getTime() - a.get('createdAt').getTime();
        }
      }
    });
  },

  sortNotes(posts, dir = 'ASC') {
    return posts.toArray().sort((a, b) => {
      var adate = new Date(a.created_at);
      var bdate = new Date(b.created_at);
      if (dir === 'ASC') {
        if (adate.getTime() === bdate.getTime()) {
          return parseInt(a.id) - parseInt(b.id);
        }
        else {
          return adate.getTime() - bdate.getTime();
        }
      } else {
        if (adate.getTime() === bdate.getTime()) {
          return parseInt(b.id) - parseInt(a.id);
        }
        else {
          return bdate.getTime() - adate.getTime();
        }
      }
    });
  },

  _defaultParams() {
    let params = {
      parent: this.get('parent'),
      include: '*',
      limit: this.get('limit')
    };

    if (this.get('plan').has('optimize_ui_fetch')) {
      params.fields = '+original(+object(+original(+form(-fields)))),+original(+object(+original(-custom_fields)))';
    }

    return params;
  },

  _paramsForRestore() {
    return assign(this._defaultParams(), {
      filters: this.get('filter'),
      include: 'nothing',
      limit: 1
    });
  },

  /*
   * Regarding before_id and after_id, this is not a mistake:
   * - newer posts are considered to have occured before on the api
   * - older posts are considered to have occured after on the api
   */

  _paramsForAfterPost(postId, limit) {
    return assign(this._defaultParams(), {
      before_id: postId,
      filters: this.get('filter') || 'all',
      limit
    });
  },

  _paramsForBeforePost(postId, limit) {
    return assign(this._defaultParams(), {
      after_id: postId,
      filters: this.get('filter') || 'all',
      limit
    });
  },

  _paramsForOlder() {
    return assign(this._defaultParams(), {
      after_id: this.get('firstPost.id'),
      filters: this.get('filter') || 'all'
    });
  },

  _paramsForNewer() {
    return assign(this._defaultParams(), {
      before_id: this.get('lastPost.id'),
      filters: this.get('filter') || 'all'
    });
  },

  _paramsForMostRecent() {
    return assign(this._defaultParams(), {
      filters: this.get('filter') || 'all'
    });
  },

  _fetch: task(function * (params) {
    let { parent } = params;
    let store = this.get('store');

    if (parent && parent.get('id')) {
      return yield store.query('post', params);
    } else {
      // Let’s construct something that behaves like an empty RecordArray Other
      // parts of the codebase seem to expect `total` or `total_count` so let’s
      // be flexible in our interface.
      let result = [];
      result.meta = { total: 0, total_count: 0 };
      return result;
    }
  }),

  _unreadPosts() {
    let post = this._lastReadPost();
    let posts = this.get('posts');
    let index = posts.indexOf(post);

    return posts.slice(index + 1);
  },

  _lastReadPost() {
    let readMarker = this.get('readMarker');
    let posts = this.get('posts');

    return posts.findBy('id', readMarker);
  },

  /**
   * Given a remote read-marker pointing to some case-message in the timeline,
   * we want to move the red line to immediately before the *next* case-message
   * or note. This means we need to set our local read state (`this.readMarker`)
   * to the ID of the immediately preceeding post. This may be the same ID
   * stored in the remote read-marker, or it may be some activity inbetween.
   *
   * Crude ascii-art sketch:
   *
   * |
   * +- Message   <== unread marker points here
   * |
   * +- Activity
   * +- Activity
   * |
   * +----------- <== we want to put the red line here
   * |
   * +- Note
   * |
   * +- Activity
   * |
   * +- Message
   * |
   *
   */
  _findPostForLocalReadState() {
    let posts = this.get('posts');
    let lastReadPostId = this.get('parent.readMarker.lastReadPostId');
    let lastReadPost = posts.findBy('id', lastReadPostId);

    if (!lastReadPost) {
      return;
    }

    let index = posts.indexOf(lastReadPost);
    let length = posts.get('length');

    // Find the post immediately before the next message or note.
    // This could be the post referenced by the remote read marker.
    for (; index < length; index++) {
      if (isMessageOrNote(posts[index + 1])) {
        return posts[index];
      }
    }
  }
});

function isMessage(post) {
  return post && !['activity', 'note'].includes(post.get('original.content.constructor.modelName'));
}

function isMessageFromCustomer(post) {
  return isMessage(post) && post.get('identity.user.role.roleType') === 'CUSTOMER';
}

function isMessageOrNote(post) {
  return post && post.get('original.content.constructor.modelName') !== 'activity';
}
