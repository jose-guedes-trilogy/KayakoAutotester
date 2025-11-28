import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import layoutStyles from 'frontend-cp/components/ko-agent-content/layout/styles';
import timelineItemStyles from 'frontend-cp/components/ko-journey-timeline/styles';
import styles from './styles';
import { run, debounce, schedule, scheduleOnce } from '@ember/runloop';
import { task, timeout } from 'ember-concurrency';
import jQuery from 'jquery';
import RSVP from 'rsvp';
import applyStreaks from '../ko-timeline-2/streaks';

import {
  isAtTop, isAtBottom, isVisibleInScrollArea, BOTTOM, MIDDLE, scrollTo
} from 'frontend-cp/lib/scroll-to';

const LAST_POST = 'LAST_POST';

const TIMELINE_EVENTS = [
  'didFetchNewer',
  'didFetchOlder',
  'didFetchMostRecent',
  'didFetchNewerAfterReply',
  'didAddSentPosts',
  'didFetchAtTimestamp'
];

const JUMP_BLIP_DELAY = 500;
const JUMP_BLIP_DURATION = 500;

export default Component.extend({
  tagName: '',

  moreOlderPosts: reads('timeline.moreOlderPosts'),
  moreNewerPosts: reads('timeline.moreNewerPosts'),

  previousTimeline: null,
  previousPostId: null,
  previousTimestamp: null,

  timeline: null,
  mode: null,
  model: null,
  timestamp: null,

  allPosts: computed('timeline.posts.[]', function() {
    return this.get('timeline.posts') || [];
  }),

  didInsertElement() {
    this._super(...arguments);
    this._registerScrollHandler();
  },

  didReceiveAttrs() {
    this._super(...arguments);

    let { timeline, postId, timestamp, previousTimestamp } = this.getProperties('timeline', 'postId', 'timestamp', 'previousTimestamp');

    if (timeline) {
      if (this._isSwitchingTimelines() || timestamp !== previousTimestamp) {
        this._switchTimelines();
      }

      this.setProperties({
        previousTimeline: timeline,
        previousPostId: postId,
        previousTimestamp: timestamp
      });
    }
  },

  didRender() {
    this._super(...arguments);
    applyStreaks(jQuery(`.${styles.container}`));
  },

  willDestroyElement() {
    this._super(...arguments);
    this._unsubscribeFromTimeline(this.get('timeline'));
    this._unregisterScrollHandler();
  },

  // Tasks
  loadPosition(timestamp) {
    return this.get('timeline.loadPosition').perform(timestamp);
  },

  loadMostRecent() {
    return this.get('timeline.loadMostRecent').perform();
  },

  fetchAtTimestamp(timestamp) {
    return this.get('timeline.fetchAtTimestamp').perform(timestamp);
  },

  fetchMostRecent() {
    return this.get('timeline.fetchMostRecent').perform();
  },

  fetchOlder() {
    return this.get('timeline.fetchOlder').perform();
  },

  fetchNewer() {
    return this.get('timeline.fetchNewer').perform();
  },

  _blipPost: task(function * (postId) {
    let element = this._findPostById(postId);
    if (element && element.length) {
      yield timeout(JUMP_BLIP_DELAY);
      element.addClass(styles.located);
      yield timeout(JUMP_BLIP_DURATION);
      element.removeClass(styles.located);
    }
  }),

  _isSwitchingTimelines() {
    let { timeline, previousTimeline } = this.getProperties('timeline', 'previousTimeline');
    return timeline !== previousTimeline;
  },

  _switchTimelines() {
    let { timestamp, timeline, previousTimeline } = this.getProperties('timestamp', 'timeline', 'previousTimeline');

    this._unsubscribeFromTimeline(previousTimeline);
    this._subscribeToTimeline(timeline);

    if (timestamp) {
      this.fetchAtTimestamp(timestamp);
    } else if (timeline.get('posts.length')) {
      this._restoreScrollPosition();
    } else {
      this.fetchMostRecent();
    }
  },

  _subscribeToTimeline(timeline) {
    if (!timeline) { return; }
    TIMELINE_EVENTS.forEach(name => timeline.on(name, this, name));
  },

  _unsubscribeFromTimeline(timeline) {
    if (!timeline) { return; }
    TIMELINE_EVENTS.forEach(name => timeline.off(name, this, name));
  },

  _registerScrollHandler() {
    this._scrollParent().on('scroll.timeline', () => this._didScroll());
  },

  _unregisterScrollHandler() {
    this._scrollParent().off('scroll.timeline');
    run.cancel(this._scrollTimer);
  },

  _didScroll() {
    this._scrollTimer = debounce(this, '_saveScrollData', 250);
    this._autoload();
  },

  _autoload() {
    let $sp = this._scrollParent();

    if (isAtTop($sp)) {
      debounce(this, '_didReachTop', 250, true);
    }

    if (isAtBottom($sp)) {
      debounce(this, '_didReachBottom', 250, true);
    }
  },

  _didReachTop() {
    if (this.get('timeline.moreOlderPosts')) {
      this._saveScrollData();
      this.fetchOlder();
    }
  },

  _didReachBottom() {
    if (this.get('timeline.moreNewerPosts')) {
      this._saveScrollData();
      this.fetchNewer();
    }
  },

  // fetched newer as a result of pushing the "load more" button
  didFetchNewer() {

  },

  didAddSentPosts() {
    this.scrollTo({ position: BOTTOM, animated: true })
      .then(() => this._saveScrollData());
  },

  // fetched newer posts after a reply has been submitted
  didFetchNewerAfterReply() {
    this.scrollTo({ position: BOTTOM, animated: true })
      .then(() => this._saveScrollData());
  },

  didFetchOlder() {
    this._restoreScrollPosition();
  },

  didFetchPosition({ postId }) {
    this.scrollTo({ postId, position: MIDDLE })
      .then(() => this._saveScrollData())
      .then(() => this._autoload());
  },

  didFetchMostRecent() {
    this.scrollTo({ postId: LAST_POST, position: BOTTOM })
      .then(() => this._saveScrollData());
  },

  didFetchAtTimestamp() {
    const targetActivityTimestamp = parseInt(this.get('timestamp'));
    let activityTimestamp;

    let postId = this.get('allPosts').filter((post) => {
      activityTimestamp = post.get('createdAt').getTime()/1000;
      return activityTimestamp === targetActivityTimestamp;
    }).get('firstObject.id');

    this.scrollTo({ postId, position: MIDDLE })
      .then(() => {
        this._saveScrollData();
        this.get('_blipPost').perform(postId);
      });
  },

  scrollTo({ postId = null, position = BOTTOM, animated = false } = {}) {
    return new RSVP.Promise((resolve, reject) => {
      scheduleOnce('afterRender', () => {
        const timeline = this._scrollParent();
        if (!timeline.length) {
          return reject(new Error('No timeline'));
        }

        let timelineItem;
        if (postId === LAST_POST) {
          timelineItem = this._findLastPost();
        } else if (postId) {
          timelineItem = this._findPostById(postId);
        }

        scrollTo({
          parent: timeline,
          element: timelineItem,
          position,
          animated
        }).then(resolve).catch(reject);

      });
    });
  },

  _saveScrollData() {
    const $scrollParent = this._scrollParent();

    const post = this._findFirstVisiblePostElement($scrollParent);

    if (post) {
      const $post = jQuery(post);
      const offsetFromParent = $post.offset().top - $scrollParent.offset().top;
      const postId = $post.data('id');

      const timeline = this.get('timeline');

      timeline.set('scrollData', {
        offset: offsetFromParent,
        id: postId
      });
    }
  },

  _restoreScrollPosition() {
    let scrollData = this.get('timeline.scrollData');

    if (scrollData) {
      schedule('afterRender', () => {
        const { offset, id } = scrollData;
        const $scrollParent = this._scrollParent();
        const $post = this._findPostById(id);

        $scrollParent[0].scrollTop = $post[0].offsetTop - offset;
      });
    } else {
      this.scrollTo({ postId: LAST_POST, position: BOTTOM });
    }
  },

  _findFirstVisiblePostElement($scrollParent) {
    const $posts = jQuery(`.${timelineItemStyles.item}`);
    return $posts.toArray().find(el => {
      return (jQuery(el).offset().top - $scrollParent.offset().top) >= 0;
    });
  },

  _findPostById(postId) {
    return jQuery(`.${timelineItemStyles.item}[data-id="${postId}"]`);
  },

  _findLastPost() {
    return jQuery(`.${styles.container} > :last-child`);
  },

  _scrollParent() {
    return jQuery(`.${layoutStyles.timeline}`);
  },

  scrollPostIntoViewIfNeeded(post) {
    let postId = post.get('id');
    if (!isVisibleInScrollArea(this._findPostById(postId), this._scrollParent())) {
      this.scrollTo({ postId, position: BOTTOM, animated: true });
    }
  },

  actions: {
    scrollPostIntoView(post) {
      scheduleOnce('afterRender', this, 'scrollPostIntoViewIfNeeded', post);
    }
  }

});
