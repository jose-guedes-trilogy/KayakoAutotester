import Evented from '@ember/object/evented';
import EmberObject from '@ember/object';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';

export default EmberObject.extend(Evented, {
  limit: null,
  scrollTop: null,

  store: service(),

  parent: null,
  parentType: computed(function() {
    return this.get('parent.constructor.modelName');
  }),

  posts: null,

  moreNewerPosts: false,
  moreOlderPosts: false,

  init() {
    this._super(...arguments);

    this.set('posts', []);
  },

  clear() {
    this.setProperties({
      posts: [],
      moreNewerPosts: false,
      moreOlderPosts: false
    });
  },

  fetchNewerAfterReply: task(function * () {
    this.trigger('willFetchNewerAfterReply');
    let data = yield this.get('_fetchNewer').perform();
    this.trigger('didFetchNewerAfterReply');
    return data;
  }),

  fetchNewer: task(function * () {
    this.trigger('willFetchNewer');
    let data = yield this.get('_fetchNewer').perform();
    this.trigger('didFetchNewer');
    return data;
  }).drop(),

  loadMostRecent: task(function * () {
    this.clear();
    return yield this.get('fetchMostRecent').perform();
  }),

  fetchAtTimestamp: task(function * (timestamp) {
    this.clear();
    let expectedNumberOfPosts = Math.round(this.get('limit') / 2);

    let afterParams = this._paramsForAfterTimestamp(timestamp, expectedNumberOfPosts);
    let afterData = yield this.get('_fetch').perform(afterParams);
    if (afterData.toArray().length) {
      let firstAfterPostTimestamp = afterData.sortBy('createdAt').get('firstObject.createdAt').getTime()/1000;
      let beforeParams = this._paramsForBeforeTimestamp(firstAfterPostTimestamp, expectedNumberOfPosts);
      let beforeData = yield this.get('_fetch').perform(beforeParams);

      this._updateInternalState(afterData, afterData.meta.total, 'NEWER', expectedNumberOfPosts);
      this._updateInternalState(beforeData, afterData.meta.total, 'OLDER', expectedNumberOfPosts);
    } else {
      this._updateInternalState(afterData, afterData.meta.total, 'NEWER', expectedNumberOfPosts);
      yield this.get('fetchMostRecent').perform();
    }

    this.trigger('didFetchAtTimestamp');
  }),

  fetchMostRecent: task(function * () {
    let params = this._paramsForMostRecent();

    let data = yield this.get('_fetch').perform(params);
    this._updateInternalState(data, data.meta.total, 'NONE');

    this.trigger('didFetchMostRecent');
    return data;
  }),

  _fetchNewer: task(function * () {
    let params = this._paramsForNewer();
    let data = yield this.get('_fetch').perform(params);
    this._updateInternalState(data, data.meta.total, 'NEWER');
    return data;
  }).drop(),

  fetchOlder: task(function * () {
    let params = this._paramsForOlder();
    let data = yield this.get('_fetch').perform(params);
    this._updateInternalState(data, data.meta.total, 'OLDER');

    this.trigger('didFetchOlder');
    return data;
  }).drop(),

  restore: task(function * () {
    let moreNewerPosts = this.get('moreNewerPosts');

    if (!moreNewerPosts) {
      let params = this._paramsForRestore();

      let { meta: { total }} = yield this.get('_fetch').perform(params);

      if (total > this.get('serverTotalPosts')) {
        this.setProperties({
          serverTotalPosts: total,
          moreNewerPosts: true
        });
      }
    }
  }),

  _updateInternalState(data, serverTotalPosts, paramsUsed, expectedNumberOfPosts = this.get('limit')) {
    this.set('serverTotalPosts', serverTotalPosts);
    const numItemsReturned = data.toArray().length;

    switch (paramsUsed) {
      case 'NEWER':
        this.set('posts', [...this.get('posts'), ...this.sortPosts(data, 'ASC')]);
        this.set('moreNewerPosts', numItemsReturned === expectedNumberOfPosts);
        break;
      case 'OLDER':
        this.set('posts', [...this.sortPosts(data, 'ASC'), ...this.get('posts')]);
        this.set('moreOlderPosts', numItemsReturned === expectedNumberOfPosts);
        break;
      case 'NONE':
        this.set('posts', this.sortPosts(data, 'ASC'));
        this.set('moreOlderPosts', numItemsReturned === expectedNumberOfPosts);
        break;
    }

    if (this.get('allPostsLoaded')) {
      this.set('moreNewerPosts', false);
      this.set('moreOlderPosts', false);
    }
  },

  containsPostId(postId) {
    let matchingPost = this.get('posts').find((post) => {
      return Number.parseInt(post.id) === Number.parseInt(postId);
    });

    return matchingPost !== null && matchingPost !== undefined;
  },

  // Interface to implement:

  _sortPosts(posts/*dir='ASC'*/) {
    return posts;
  },

  _paramsForRestore() {
    return {};
  },

  _paramsForOlder() {
    return {};
  },

  _paramsForNewer() {
    return {};
  },

  _paramsForAfterTimestamp() {
    return {};
  },

  _paramsForBeforeTimestamp() {
    return {};
  },

  _paramsForMostRecent() {
    return {};
  },

  _fetch: task(function * (/*params*/) {
    yield [];
  })

});
