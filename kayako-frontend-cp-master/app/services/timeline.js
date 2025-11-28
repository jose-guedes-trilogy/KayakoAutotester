import Service, { inject as service } from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import _ from 'npm:lodash';
import { getOwner } from '@ember/application';

import PostTimeline from 'frontend-cp/timelines/post';
import ActivityTimeline from 'frontend-cp/timelines/activity';

import { variation } from 'ember-launch-darkly';

const Promise = EmberPromise;

const includeActivities = (filter) => filter === 'all';

/**
 * Perform merge by timestamp.
 * When same-date conflicts occur, the first timeline objects will be
 * considered to be newer.
 *
 * @param {Array<DS.Model>} activities 1st timeline
 * @param {Array<DS.Model>} posts 2nd timeline
 * @param {String} direction older or newer
 * @return {Array<DS.Model>} merged timeline
 */
const mergeTwoTimelines = (activities, posts, direction) => {
  let postsWithActivities = [];
  while (posts.length !== 0 || activities.length !== 0) {
    let topPost = posts[0];
    let topActivity = activities[0];

    if (!topPost) {
      postsWithActivities.push(topActivity);
      activities.splice(0, 1);
      continue;
    }

    if (!topActivity) {
      postsWithActivities.push(topPost);
      posts.splice(0, 1);
      continue;
    }

    let postDate = topPost.get('createdAt');
    let activityDate = topActivity.get('createdAt');

    if (direction === 'newer') {
      if (activityDate.getTime() < postDate.getTime()) {
        postsWithActivities.push(topActivity);
        activities.splice(0, 1);
      } else {
        postsWithActivities.push(topPost);
        posts.splice(0, 1);
      }
    } else if (direction === 'older') {
      if (postDate.getTime() > activityDate.getTime()) {
        postsWithActivities.push(topPost);
        posts.splice(0, 1);
      } else {
        postsWithActivities.push(topActivity);
        activities.splice(0, 1);
      }
    }
  }
  return postsWithActivities;
};

export default Service.extend({
  store: service(),
  processManager: service(),

  timelineForCase(model, filter) {
    let processManager = this.get('processManager');
    let type = model.get('isNew') ? 'case-new' : 'case';
    let process = processManager.getOrCreateProcess(model, type);
    let attr = 'timeline';

    let timeline = process && process.get(attr);

    if (!timeline) {
      if (variation('ops-create-timeline-objects-from-container')) {
        let Timeline = this._getTimelineFactory('post');

        timeline = Timeline.create({
          filter: filter || 'all',
          parent: model,
          limit: 30
        });
      } else {
        timeline = PostTimeline.create({
          filter: filter || 'all',
          parent: model,
          limit: 30,
          store: this.get('store')
        });
      }

      if (model.get('readMarker.unreadCount') > 0) {
        timeline.storeLocalReadState();
      }

      if (process) {
        process.on('willForeground', () => {
          timeline.get('restore').perform();
        });

        process.on('willBackground', () => {
          timeline.clearLocalReadState();
        });

        process.on('willDestroy', () => {
          timeline.destroy();
        });

        process.set(attr, timeline);
      }
    } else if (filter) {
      timeline.setFilter(filter);
    }

    return timeline;
  },

  timelineForCaseUser(model, user) {
    let processManager = this.get('processManager');
    let type = model.get('isNew') ? 'case-new' : 'case';
    let process = processManager.getOrCreateProcess(model, type);
    let attr = 'userTimeline';

    let timeline = process && process.get(attr);

    if (!timeline) {
      if (variation('ops-create-timeline-objects-from-container')) {
        let Timeline = this._getTimelineFactory('activity');

        timeline = Timeline.create({
          parent: user,
          limit: 30
        });
      } else {
        timeline = ActivityTimeline.create({
          parent: user,
          limit: 30,
          store: this.get('store')
        });
      }


      if (process) {
        process.on('willForeground', () => {
          timeline.get('restore').perform();
        });

        process.on('willDestroy', () => {
          timeline.destroy();
        });

        process.set(attr, timeline);
      }
    }

    return timeline;
  },

  timelineForCaseOrganization(model, organization) {
    let processManager = this.get('processManager');
    let type = model.get('isNew') ? 'case-new' : 'case';
    let process = processManager.getOrCreateProcess(model, type);
    let attr = 'organizationTimeline';

    let timeline = process && process.get(attr);

    if (!timeline) {
      if (variation('ops-create-timeline-objects-from-container')) {
        let Timeline = this._getTimelineFactory('activity');

        timeline = Timeline.create({
          parent: organization,
          limit: 30
        });
      } else {
        timeline = ActivityTimeline.create({
          parent: organization,
          limit: 30,
          store: this.get('store')
        });
      }

      if (process) {
        process.on('willForeground', () => {
          timeline.get('restore').perform();
        });

        process.on('willDestroy', () => {
          timeline.destroy();
        });

        process.set(attr, timeline);
      }
    }

    return timeline;
  },

  timelineForUser(user) {
    let processManager = this.get('processManager');
    let process = processManager.getOrCreateProcess(user, 'user');
    let attr = 'timeline';

    let timeline = process && process.get(attr);

    if (!timeline) {
      if (variation('ops-create-timeline-objects-from-container')) {
        let Timeline = this._getTimelineFactory('activity');

        timeline = Timeline.create({
          parent: user,
          limit: 30
        });
      } else {
        timeline = ActivityTimeline.create({
          parent: user,
          limit: 30,
          store: this.get('store')
        });
      }

      if (process) {
        process.on('willForeground', () => {
          timeline.get('restore').perform();
        });

        process.on('willDestroy', () => {
          timeline.destroy();
        });

        process.set(attr, timeline);
      }
    }

    return timeline;
  },

  timelineForUserOrganization(user, organization) {
    let processManager = this.get('processManager');
    let process = processManager.getOrCreateProcess(user, 'user');
    let attr = 'organizationTimeline';

    let timeline = process && process.get(attr);

    if (!timeline) {
      if (variation('ops-create-timeline-objects-from-container')) {
        let Timeline = this._getTimelineFactory('activity');

        timeline = Timeline.create({
          parent: organization,
          limit: 30
        });
      } else {
        timeline = ActivityTimeline.create({
          parent: organization,
          limit: 30,
          store: this.get('store')
        });
      }

      if (process) {
        process.on('willForeground', () => {
          timeline.get('restore').perform();
        });

        process.on('willDestroy', () => {
          timeline.destroy();
        });

        process.set(attr, timeline);
      }
    }

    return timeline;
  },

  timelineForOrganization(organization) {
    let processManager = this.get('processManager');
    let process = processManager.getOrCreateProcess(organization, 'organization');
    let attr = 'timeline';

    let timeline = process && process.get(attr);

    if (!timeline) {
      if (variation('ops-create-timeline-objects-from-container')) {
        let Timeline = this._getTimelineFactory('activity');

        timeline = Timeline.create({
          parent: organization,
          limit: 30
        });
      } else {
        timeline = ActivityTimeline.create({
          parent: organization,
          limit: 30,
          store: this.get('store')
        });
      }

      if (process) {
        process.on('willForeground', () => {
          timeline.get('restore').perform();
        });

        process.on('willDestroy', () => {
          timeline.destroy();
        });

        process.set(attr, timeline);
      }
    }

    return timeline;
  },


  /**
   * Get a single post.
   *
   * @private
   * @param {DS.Model} model model
   * @param {Number} postId post id
   * @return {Promise<DS.Model>} post
   */
  _getSinglePost(model, postId) {
    let post = this.get('store').peekRecord('post', postId);
    if (post) {
      if (post.get('isReloading')) {
        return post.reload();
      } else {
        return Promise.resolve(post);
      }
    } else {
      post = this.get('store').createRecord('post', { id: postId });
      post.set('parent', model);
      return post.reload();
    }
  },

  /**
   * Return posts for a given parent model.
   *
   * @param {DS.Model} model model
   * @param {Number} postId reference post id
   * @param {[String]} options.direction whether to request 'older' or 'newer' posts
   * @param {[Number]} options.count post count
   * @param {[Number]} options.including whether to include the post with specified id
   * @return {Promise} posts
   */
  getPosts(model, postId, {
    direction = 'older',
    count = 30,
    includeActivities = true,
    including = false
  } = {}) {
    let posts, startingPost, morePostsAvailable;

    const startFromTop = !postId;
    const queryParamName = direction === 'older' ? 'afterId' : 'beforeId';

    if (postId) {
      posts = this._getSinglePost(model, postId).then((post) => {
        startingPost = post;
        return this._fetchPosts(model, { [queryParamName]: postId, limit: including ? count - 1 : count }).then(posts => [post].concat(posts.toArray()));
      });
    } else {
      posts = (direction === 'older' ? this._fetchPosts(model, { limit: count }) : this._fetchPosts(model, { beforeId: 0, limit: count }));
    }

    return posts.then(posts => {
      morePostsAvailable = !(posts.get('length') < (including ? count : count + 1));

      let activities = includeActivities ? this._getActivitiesForPosts(model, posts, direction, startFromTop, morePostsAvailable) : [];
      return Promise.resolve(activities)
      .then(activities => {

        // Merge activities and posts
        let all = mergeTwoTimelines(activities, posts, direction);

        // Finally, remove initial post if it's not required
        all = including ? all : all.filter(p => p !== startingPost);
        return { posts: all, morePostsAvailable };
      });
    });
  },

  loadPostsAbove(state, { model, filter, postId, including, count = 30 }) {
    if (state.get('loadingTop') || model.get('isNew')) {
      return Promise.resolve();
    }

    state.set('loadingTop', true);

    return this.getPosts(model, postId, {
      direction: 'older',
      count,
      including,
      includeActivities: includeActivities(filter)
    }).then(({ posts, morePostsAvailable }) => {
      const postsState = state.get('posts');

      if (!postsState) {
        state.set('posts', posts);
      } else {
        postsState.unshiftObjects(posts.reverse());
      }

      state.set('topPostsAvailable', morePostsAvailable);
    }).finally(() => {
      state.set('loadingTop', false);
    });
  },

  loadPostsBelow(state, { model, filter, postId, count = 30 }) {
    if (state.get('loadingBottom') || model.get('isNew')) {
      return Promise.resolve();
    }

    state.set('loadingBottom', true);
    return this.getPosts(model, postId, {
      direction: 'newer',
      count,
      includeActivities: includeActivities(filter)
    }).then(({ posts, morePostsAvailable }) => {
      const postsState = state.get('posts');

      if (!postsState) {
        state.set('posts', posts);
      } else {
        postsState.addObjects(posts);
      }

      state.set('loadingBottom', false);
      state.set('bottomPostsAvailable', morePostsAvailable);
    }).finally(() => {
      state.set('loadingBottom', false);
    });
  },

  loadActivitiesAbove(state, { model, sortOrder = 'newest', activity, count = 30 }) {
    if (state.get('loadingTop') || model.get('isNew')) {
      return Promise.resolve();
    }

    state.set('loadingTop', true);
    let since, until;

    function unix(date) {
      return Math.floor(date.getTime() / 1000);
    }

    if (activity) {
      const createdAt = activity.get('createdAt');
      if (sortOrder === 'oldest') {
        since = createdAt && unix(createdAt);
      } else {
        until = createdAt && unix(createdAt);
      }
    }

    return this.get('store').query('activity', {
      parent: model,
      until,
      since,
      sort_order: sortOrder === 'newest' ? 'DESC' : 'ASC',
      limit: count
    }).then(posts => {
      let postsAsArray = posts.toArray();
      let topPostsAvailable = postsAsArray.length >= count;
      state.get('posts').unshiftObjects(postsAsArray.reverse());
      state.set('topPostsAvailable', topPostsAvailable);
    }).finally(() => {
      state.set('loadingTop', false);
    });
  },

  /**
   * Get all activites for a range of posts.
   *
   * @private
   * @param {DS.Model} model model
   * @param {Array<DS.Model>} posts posts
   * @param {String} direction older or newer
   * @param {Boolean} startFromTop if true, activities will be fetched from the beginning of timeline
   * @param {Boolean} morePostsAvailable if true, activities to be fetched will be bounded by the timestamp of the last post
   * @return {Promise<Array<DS.Model>>} activities
   */
  _getActivitiesForPosts(model, posts, direction, startFromTop, morePostsAvailable) {
    let parseNextUrl = (nextUrl) => {
      return _.fromPairs(nextUrl.split('&').map((segment) => segment.split('=')));
    };

    // Fetch all activities between two points in time (inclusive).
    let fetchActivities = ({ since, until, offset }, end, direction) => this.get('store').query('activity', {
      parent: model,
      // since and until are exclusive
      since, until,
      offset,
      sort_order: direction === 'newer' ? 'ASC' : 'DESC',
      limit: 10
    }).then(result => {
      let isActivityNotCreatedBeforeLastRecord = activity => activity.get('createdAt').getTime() >= end.getTime();
      let isActivityNotCreatedAfterLastRecord = activity => activity.get('createdAt').getTime() <= end.getTime();
      let filteringFunction;
      if (!end) {
        filteringFunction = () => true;
      } else if (direction === 'older') {
        filteringFunction = isActivityNotCreatedBeforeLastRecord;
      } else {
        filteringFunction = isActivityNotCreatedAfterLastRecord;
      }

      let activities = _.filter(result.toArray(), filteringFunction);
      const nextUrl = result.get('meta').next;
      if (activities.length < 10 || !nextUrl) {
        return activities;
      } else {
        return fetchActivities(parseNextUrl(nextUrl), end, direction)
        .then(moreActivities => activities.concat(moreActivities));
      }
    });

    const from = posts[0];
    const to = morePostsAvailable ? posts[posts.length - 1] : null;
    const newer = direction === 'newer';
    const start = from ? new Date(from.get('createdAt').getTime() - (newer ? 0 : 1000)).getTime() : null;
    const end = morePostsAvailable ? new Date(to.get('createdAt').getTime() - (newer ? 1000 : 0)) : null;
    const timestamps = {
      since: (direction === 'newer' && !startFromTop) ? Math.floor((start - 1000) / 1000) : null,
      until: (direction === 'older' && !startFromTop) ? Math.floor((start + 1000) / 1000) : null
    };

    return fetchActivities(timestamps, end, direction);
  },

  /**
   * Retrieves posts from the server. Returns a promise which resolves when
   * fetch is successful
   *
   * @private
   * @param {DS.Model} model model
   * @param {[Number]} options.beforeId id of the post
   * @param {[Number]} options.afterId id of the post
   * @return {Promise} promise
   */
  _fetchPosts(model, { beforeId = null, afterId = null, limit = 10 } = {}) {
    let params = {
      parent: model,
      limit,
      include: 'post,user,role,identity,note,channel,case-message,mailbox,location,message-recipient,identity-email,attachment,case-reply,user-note,identity-twitter,identity-facebook,case-note,chat-message,user-minimal,facebook-comment,facebook-message,facebook-post,twitter-message,media,twitter-tweet'
    };
    if (beforeId !== null) {
      params.before_id = beforeId;
    }
    if (afterId !== null) {
      params.after_id = afterId;
    }

    return this.get('store').query('post', params).then((posts) => {
      if (beforeId !== null) {
        return posts.toArray().reverse();
      } else {
        return posts.toArray();
      }
    });
  },

  _getTimelineFactory(type) {
    return getOwner(this).factoryFor(`timeline:${type}`);
  }
});
