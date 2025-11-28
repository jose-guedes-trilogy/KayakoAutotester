import Ember from 'ember';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { or } from '@ember/object/computed';
import { isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';
import layoutStyles from 'frontend-cp/components/ko-agent-content/layout/styles';
import styles from './styles';
import timelinePostStyles from 'frontend-cp/components/ko-timeline-2/list/post/styles';
import jQuery from 'jquery';
import { run, schedule, scheduleOnce } from '@ember/runloop';
import RSVP from 'rsvp';
import applyStreaks from './streaks';
import { task, timeout } from 'ember-concurrency';
import OperationAsPost from 'frontend-cp/lib/facade/operation-as-post';
import isInternalTag from 'frontend-cp/utils/is-internal-tag';

import {
  MIDDLE, BOTTOM, TOP, isVisibleInScrollArea, scrollTo, isAtTop, isAtBottom
} from 'frontend-cp/lib/scroll-to';

const LAST_POST = 'LAST_POST';
const LAST_POST_OF_TYPE_MESSAGE_OR_NOTE = 'LAST_POST_OF_TYPE_MESSAGE_OR_NOTE';
const UNREAD = 'UNREAD';

// how many px scrolled up from the bottom do we still consider as being "pinned"
// so we scroll to the bottom when new content comes in
const PIN_BUFFER = 50;

const TIMELINE_EVENTS = [
  'didFetchNewer',
  'didFetchOlder',
  'didFetchPosition',
  'didFetchMostRecent',
  'didFetchNewerAfterReply',
  'willFetchNewerFromKRE',
  'didFetchNewerFromKRE',
  'didAddSentPosts',
  'didAddSendingOperation',
  'didUpdateSendingOperation'
];

const JUMP_BLIP_DELAY = 500;
const JUMP_BLIP_DURATION = 500;

export default Component.extend({
  tagName: '',

  // Attrs
  postId: null,
  noteId: null,
  canResend: true,

  onCopyLink: () => { },
  onReplyToPost: () => { },
  onReplyWithQuote: () => { },
  onAddCC: () => { },
  onResend: () => { },

  // Services
  store: service(),
  router: service('-routing'),
  window: service(),
  session: service(),

  // State
  timeline: null,
  isScrolling: false,
  isPinnedToBottom: false,
  isItemMenuOpen: false,

  isLoading: or('timeline.fetchMostRecent.isRunning', 'timeline.fetchPosition.isRunning'),

  posts: computed('timeline.posts', function () {
    return this.get('timeline.posts') || [];
  }),

  moreOlderPosts: computed.alias('timeline.moreOlderPosts'),
  moreNewerPosts: computed.alias('timeline.moreNewerPosts'),
  previousTimeline: null,
  previousPostId: null,
  previousNoteId: null,

  hasUnseenPosts: computed.gt('model.readMarker.unreadCount', 0),
  hasLatestReadState: computed.and('timeline.updateRemoteReadState.isIdle', 'timeline.markAllAsSeen.isIdle'),
  inArchiveMode: computed('postId', function () {
    let postId = this.get('postId');
    return !isEmpty(postId) && postId !== UNREAD;
  }),
  isNotPinnedToBottom: computed.not('isPinnedToBottom'),
  shouldDisplayBlueBar: computed.and(
    'hasUnseenPosts',      // are there unseen posts?
    'hasLatestReadState',  // have we loaded/persisted all read state?
    'isNotPinnedToBottom'  // are we scrolled away from the bottom of the timeline?
  ),

  didReceiveAttrs() {
    this._super(...arguments);

    let { timeline, postId, noteId } = this.getProperties('timeline', 'postId', 'noteId');

    if (timeline) {
      if (this._isSwitchingTimelines()) {
        this._switchTimelines();
      } else if (this._isSwitchingQueryParameters()) {
        this._switchQueryParameters();
      } else {
        // DOUBLE RENDER KABOOOOM!!!!
      }

      this.setProperties({
        previousTimeline: timeline,
        previousPostId: postId,
        previousNoteId: noteId
      });
    }
  },

  didInsertElement() {
    this._super(...arguments);
    this._registerScrollHandler();
    this._registerWindowFocusHandler();
    this._updateLocalReadState();
  },

  didRender() {
    this._super(...arguments);
    applyStreaks(jQuery(`.${styles.container}`));
  },

  willDestroyElement() {
    this._super(...arguments);
    this._unsubscribeFromTimeline(this.get('timeline'));
    this._unregisterScrollHandler();
    this._unregisterWindowFocusHandler();
  },

  // event listeners

  _subscribeToTimeline(timeline) {
    if (!timeline) { return; }
    TIMELINE_EVENTS.forEach(name => timeline.on(name, this, name));
  },

  _unsubscribeFromTimeline(timeline) {
    if (!timeline) { return; }
    TIMELINE_EVENTS.forEach(name => timeline.off(name, this, name));
  },

  _registerScrollHandler() {
    this._scrollParent().on('scroll.timeline', run.bind(this, '_didScroll'));
  },

  _unregisterScrollHandler() {
    this._scrollParent().off('scroll.timeline');
    run.cancel(this._scrollTimer);
  },

  _registerWindowFocusHandler() {
    this.get('window').on('focus', this, '_updateRemoteReadState');
  },

  _unregisterWindowFocusHandler() {
    this.get('window').off('focus', this, '_updateRemoteReadState');
  },

  // CP's
  allPosts: computed('meaningfulPosts.[]', 'timeline.{sentPosts,sendingOperations}.[]', function () {
    let posts = this.get('meaningfulPosts');
    let sentPosts = (this.get('timeline.sentPosts') || []).filter(post => !posts.includes(post));
    let creator = this.get('session.user');
    let sendingOperations = this.get('timeline.sendingOperations') || [];
    let seenClientIds = [...posts.mapBy('clientId'), ...sentPosts.mapBy('clientId')];
    let sendingPosts = sendingOperations
      .filter(operation => !seenClientIds.includes(operation.attrs.clientId))
      .map(operation => OperationAsPost.create({ operation, creator }));

    return [...posts, ...sentPosts, ...sendingPosts];
  }),

  meaningfulPosts: computed('posts', function() {
    return this.get('posts').map(removeInternalTagsPost).filter(isPostMeaningful);
  }),

  postsPriorToConversationCreation: computed('allPosts', function () {
    let allPosts = this.get('allPosts');
    let conversationStartDate = this.get('model.createdAt');
    return allPosts.filter((post) => {
      return conversationStartDate > post.get('createdAt');
    });
  }),

  hasPostsPriorToConversationCreation: computed.gt('postsPriorToConversationCreation.length', 0),

  postsAfterConversationCreation: computed('allPosts', function () {
    let allPosts = this.get('allPosts');
    let conversationStartDate = this.get('model.createdAt');
    return allPosts.filter((post) => {
      return conversationStartDate <= post.get('createdAt');
    });
  }),

  // Tasks
  _blipPost: task(function* (postId) {
    let element = this._findPostById(postId).children('div');
    if (element && element.length) {
      yield timeout(JUMP_BLIP_DELAY);
      element.addClass(styles.located);
      yield timeout(JUMP_BLIP_DURATION);
      element.removeClass(styles.located);
    }
  }),

  handleDidFetchNewerFromKRE: task(function* () {
    if (!this._wasPinnedToBottom || !this.get('window.visible')) {
      yield this.get('model').reload();
      yield this._updateLocalReadState();
    }

    if (this._wasPinnedToBottom) {
      yield this.scrollTo({ position: BOTTOM, animated: true });
      yield this._saveScrollData();
      yield this._updateRemoteReadState();
    }
  }).restartable(),

  loadPosition({ postId, noteId }) {
    if (postId === UNREAD) {
      postId = this.get('model.readMarker.lastReadPostId');
    }
    if (postId) {
      return this.get('timeline.loadPosition').perform({ postId });
    }
    return this.get('timeline.loadPosition').perform({ noteId });
  },

  loadMostRecent() {
    return this.get('timeline.loadMostRecent').perform();
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

  _updateRemoteReadState() {
    if (!this.get('window.visible')) {
      return;
    }

    if (this.get('moreNewerPosts')) {
      return;
    }

    if (!this._isPinnedToBottom()) {
      return;
    }

    let task = this.get('timeline.updateRemoteReadState');
    if (task) {
      task.perform();
    }
  },

  _updateLocalReadState() {
    if (!this.get('hasUnseenPosts')) {
      return;
    }

    if (this.get('timeline.readMarker')) {
      return;
    }

    this.get('timeline').storeLocalReadState();
  },

  _didScroll() {
    this._scrollTimer = run.debounce(this, '_saveScrollData', 250);
    this._handleReachingTimelineBoundary();
    this.set('isPinnedToBottom', this._isPinnedToBottom());
  },

  _handleReachingTimelineBoundary() {
    let $sp = this._scrollParent();

    if (isAtTop($sp)) {
      run.debounce(this, '_didReachTop', 250, true);
    }

    if (isAtBottom($sp)) {
      run.debounce(this, '_didReachBottom', 250, true);
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
    } else {
      this._updateRemoteReadState();
    }
  },

  _findFirstVisiblePostElement($scrollParent) {
    const $posts = jQuery(`.${timelinePostStyles.post}`);
    return $posts.toArray().find(el => {
      return (jQuery(el).offset().top - $scrollParent.offset().top) >= 0;
    });
  },

  _scrollParent() {
    return jQuery(`.${layoutStyles.timeline}`);
  },

  _findPostById(postId) {
    return jQuery(`.${timelinePostStyles.post}[data-id="${postId}"]`);
  },

  _findPostByNoteId(noteId) {
    return jQuery(`.${timelinePostStyles.post}[data-note-id="${noteId}"]`);
  },

  _findLastPost() {
    return jQuery(`.${styles.container} > :last-child`);
  },

  _findLastPostOfTypeMessageOrNote() {
    return jQuery(`.${timelinePostStyles.post}.message-or-note`).last();
  },

  _isSwitchingTimelines() {
    let { timeline, previousTimeline } = this.getProperties('timeline', 'previousTimeline');

    return timeline !== previousTimeline;
  },

  _isSwitchingQueryParameters() {
    let { postId, previousPostId, noteId, previousNoteId } = this.getProperties('postId', 'previousPostId', 'noteId', 'previousNoteId');

    return postId !== previousPostId || noteId !== previousNoteId;
  },

  _switchQueryParameters() {
    let postId = this.get('postId');
    let noteId = this.get('noteId');

    if (postId) {
      this.loadPosition({ postId });
    } else if (noteId) {
      this.loadPosition({ noteId });
    } else {
      this.loadMostRecent();
    }
  },

  _switchTimelines() {
    let { postId, noteId, timeline, previousTimeline } = this.getProperties('postId', 'noteId', 'timeline', 'previousTimeline');

    this._unsubscribeFromTimeline(previousTimeline);
    this._subscribeToTimeline(timeline);

    if (postId) {
      this.loadPosition({ postId });
    } else if (noteId) {
      this.loadPosition({ noteId });
    } else if (timeline.get('posts.length')) {
      this._restoreScrollPosition();
    } else {
      this.fetchMostRecent();
    }
  },

  // fetched newer as a result of pushing the "load more" button
  didFetchNewer() {
    this._updateRemoteReadState();
  },

  didAddSentPosts() {
    this.scrollTo({ position: BOTTOM, animated: true })
      .then(() => this._saveScrollData());
  },

  didAddSendingOperation() {
    this.scrollTo({ position: BOTTOM, animated: true })
      .then(() => this._saveScrollData());
  },

  didUpdateSendingOperation() {
    this.scrollTo({ position: BOTTOM, animated: true })
      .then(() => this._saveScrollData());
  },

  // fetched newer posts after a reply has been submitted
  didFetchNewerAfterReply() {
    this.scrollTo({ position: BOTTOM, animated: true })
      .then(() => this._saveScrollData())
      .then(() => this._updateRemoteReadState());
  },

  // fetching newer posts as result of a NEW_POST event from KRE
  // need to check if they are currently pinned, as by the time didFetchNewerFromKRE
  // is triggered, there will be content inserted below
  willFetchNewerFromKRE() {
    this._wasPinnedToBottom = this._isPinnedToBottom();
  },

  // fetched newer posts as result of a NEW_POST event from KRE
  didFetchNewerFromKRE() {
    this.get('handleDidFetchNewerFromKRE').perform();
    let action = this.get('onDidFetchMostRecent');
    let posts = this.get('posts');

    if (action && posts) {
      action(posts);
    }
  },

  didFetchOlder() {
    this._restoreScrollPosition();
  },

  didFetchPosition({ postId, noteId }) {
    if (postId) {
      // if loading around the read marker, use the next post instead
      if (this.get('postId') === UNREAD) {
        const posts = this.get('posts');
        const post = posts.findBy('id', postId);
        const index = posts.indexOf(post);
        const nextPost = posts.objectAt(index + 1);
        if (nextPost) {
          postId = nextPost.get('id');
        }
      }
    }

    scheduleOnce('afterRender', this, 'jumpToPost', { postId, noteId });
  },

  jumpToPost({ postId, noteId }) {
    this.scrollTo({ postId, noteId, position: MIDDLE })
      .then(() => this.get('_blipPost').perform(postId))
      .then(() => this._saveScrollData())
      .then(() => this._handleReachingTimelineBoundary());
  },

  didFetchMostRecent() {
    this._updateLocalReadState();

    this.scrollTo({ postId: LAST_POST_OF_TYPE_MESSAGE_OR_NOTE, position: TOP })
      .then(() => this._saveScrollData())
      .then(() => this._updateRemoteReadState());
    let action = this.get('onDidFetchMostRecent');
    let posts = this.get('posts');

    if (action && posts) {
      action(posts);
    }
  },

  _isPinnedToBottom() {
    let $timeline = this._scrollParent();
    let timelineHeight = $timeline.height();
    let scrollDistance = $timeline.prop('scrollTop');
    let contentHeight = $timeline.prop('scrollHeight');
    let buffer = PIN_BUFFER;

    return scrollDistance + timelineHeight >= (contentHeight - buffer);
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
        const post = $post[0];

        if (!post) {
          return;
        }

        $scrollParent[0].scrollTop = post.offsetTop - offset;
      });
    } else {
      this.scrollTo({ postId: LAST_POST, position: BOTTOM });
    }
  },

  scrollTo({ postId = null, noteId = null, position = BOTTOM, animated = false } = {}) {
    animated = animated && !Ember.testing;

    return new RSVP.Promise((resolve, reject) => {
      scheduleOnce('afterRender', () => {
        const timeline = this._scrollParent();

        if (!timeline.length) {
          resolve();
          return;
        }

        let timelineItem;
        if (postId === LAST_POST) {
          timelineItem = this._findLastPost();
        } else if (postId === LAST_POST_OF_TYPE_MESSAGE_OR_NOTE) {
          timelineItem = this._findLastPostOfTypeMessageOrNote();
        } else if (postId) {
          timelineItem = this._findPostById(postId);
        } else if (noteId) {
          timelineItem = this._findPostByNoteId(noteId);
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

  scrollPostIntoViewIfNeeded(post) {
    let postId = post.get('id');
    if (!isVisibleInScrollArea(this._findPostById(postId), this._scrollParent())) {
      this.scrollTo({ postId, position: BOTTOM, animated: true });
    }
  },

  // Actions
  actions: {
    loadOlder() {
      return this.fetchOlder();
    },
    loadNewer() {
      return this.fetchNewer();
    },
    scrollPostIntoView(post) {
      scheduleOnce('afterRender', this, 'scrollPostIntoViewIfNeeded', post);
    },
    jumpToLatest() {
      if (!this.get('inArchiveMode')) {
        this.scrollTo({ position: BOTTOM, animated: true });
      } else {
        let router = this.get('router');
        let kase = this.get('model');
        router.transitionTo('session.agent.cases.case.index', [kase], { postId: UNREAD });
      }
    },
    markAllAsSeen() {
      this.get('timeline.markAllAsSeen').perform();
    }
  }

});

function removeInternalTagsPost(post) {
  if (post.get('original.isActivity') && post.get('original.activity') === 'update_case') {
    let actions = post.get('original.actions') || [];

    const filterInternalTags = ([tags]) => {
      return tags ? tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => !isInternalTag({ name: tag }))
        .join(', ') : '';
    };

    let filtered = actions.filter(action => {
      if (action.get('field') === 'tags' || action.get('field') === 'name') {
        const oldTags = filterInternalTags([action.get('oldValue')]);
        const newTags = filterInternalTags([action.get('newValue')]);
        action.set('oldValue', oldTags);
        action.set('newValue', newTags);
        return (oldTags || newTags) && oldTags !== newTags;
      }
      return true;
    });
    post.set('original.actions', filtered);
  }
  return post;
}

function isPostMeaningful(post) {
  if (isPostAnEmptyUpdate(post)) {
    return false;
  }
  return true;
}

function isPostAnEmptyUpdate(post) {
  return post.get('original.isActivity') &&
    post.get('original.activity') === 'update_case' &&
    post.get('original.actions.length') === 0;
}
