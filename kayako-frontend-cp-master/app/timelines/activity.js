import Timeline from './timeline';

import { task } from 'ember-concurrency';
import { assign } from '@ember/polyfills';
import { reads } from '@ember/object/computed';

export default Timeline.extend({

  firstPost: reads('posts.firstObject'),
  lastPost: reads('posts.lastObject'),

  _defaultParams() {
    return {
      parent: this.get('parent'),
      include: '*',
      limit: this.get('limit')
    };
  },

  _paramsForRestore() {
    return assign(this._defaultParams(), {
      include: 'nothing',
      limit: 1
    });
  },

  _paramsForOlder() {
    let time = this.get('firstPost.createdAt');
    if (!time) {
      return assign(this._defaultParams(), {});
    }
    return assign(this._defaultParams(), {
      until: time.getTime() / 1000
    });
  },

  _paramsForNewer() {
    let time = this.get('lastPost.createdAt');
    if (!time) {
      return assign(this._defaultParams(), {});
    }
    return assign(this._defaultParams(), {
      since: time.getTime() / 1000
    });
  },

  _paramsForMostRecent() {
    return assign(this._defaultParams(), {});
  },

  _paramsForAfterTimestamp(timestamp, limit) {
    return assign(this._defaultParams(), {
      since: timestamp,
      filters: this.get('filter') || 'all',
      limit
    });
  },

  _paramsForBeforeTimestamp(timestamp, limit) {
    return assign(this._defaultParams(), {
      until: timestamp,
      filters: this.get('filter') || 'all',
      limit
    });
  },

  _fetch: task(function * (params) {
    let store = this.get('store');
    return yield store.query('activity', params);
  }),

  sortPosts(posts, dir = 'ASC') {
    return posts.toArray().sort((a, b) => {
      if (dir === 'ASC') {
        return a.get('createdAt').getTime() - b.get('createdAt').getTime();
      } else {
        return b.get('createdAt').getTime() - a.get('createdAt').getTime();
      }
    });
  }

});
