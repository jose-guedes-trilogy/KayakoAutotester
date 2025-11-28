import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { task, timeout } from 'ember-concurrency';
import styles from './styles';
import layoutStyles from 'frontend-cp/components/ko-agent-content/layout/styles';
import timelinePostStyles from 'frontend-cp/components/ko-timeline-2/list/post/styles';
import journeyTimelineItemStyles from 'frontend-cp/components/ko-journey-timeline/styles';
import { MIDDLE, scrollTo } from 'frontend-cp/lib/scroll-to';
import jQuery from 'jquery';
import RSVP from 'rsvp';
import { scheduleOnce } from '@ember/runloop';

const JUMP_BLIP_DELAY = 200;
const JUMP_BLIP_DURATION = 300;

export default Component.extend({
  tagName: '',

  // Attributes
  notes: [],

  // Service
  routing: service('-routing'),
  store: service(),
  tabStore: service(),
  advancedSearch: service(),
  i18n: service(),

  // Methods
  pinTooltipText(note) {
    const i18n = this.get('i18n');
    let parentType = this.getNoteParentType(note);
    switch (parentType) {
      case 'users': return i18n.t('generic.unpin.user');
      case 'organizations': return i18n.t('generic.unpin.org');
      case 'cases': return i18n.t('generic.unpin.case');
    }
  },

  getNoteParentType(note) {
    return note.get('resourceUrl').match(/([a-z]+)\/[0-9]+\/[a-z]+\/[0-9]+$/)[1];
  },

  getNoteParentId(note) {
    return note.get('resourceUrl').match(/[a-z]+\/([0-9]+)\/[a-z]+\/[0-9]+$/)[1];
  },

  getNoteParentIcon(note) {
    let parentType = this.getNoteParentType(note);
    let parentId = this.getNoteParentId(note);
    switch (parentType) {
      case 'users': return this.get('store').peekRecord('user', parentId);
      case 'organizations': return this.get('store').peekRecord('organization', parentId);
      case 'cases': return 'icon--conversation';
    }
  },

  // Tasks
  _blipPost: task(function* (element, styles) {
    if (element && element.length) {
      yield timeout(JUMP_BLIP_DELAY);
      element.addClass(styles.located);
      yield timeout(JUMP_BLIP_DURATION);
      element.removeClass(styles.located);
    }
  }),

  unpinNote: task(function* (note, event) {
    $(event.currentTarget).addClass(styles.processing);

    let entityName = this.getNoteParentType(note);
    let modelName = entityName.slice(0, -1);
    let entityId = this.getNoteParentId(note);
    let entity;

    try {
      note.setProperties({ isPinned: false, pinnedBy: null });
      yield note.save({ adapterOptions: { entityName, entityId } });

      entity = this.get('store').peekRecord(modelName, entityId);
      entity.decrementProperty('pinnedNotesCount');
    }
    catch (e) {
      if (!Ember.testing && window.Bugsnag) {
        window.Bugsnag.notifyException(e, 'Failed to unpin note', {}, 'info');
      }
    }
    finally {
      if (event.currentTarget) {
        $(event.currentTarget).removeClass(styles.processing);
      }
    }
  }).drop(),

  scrollTo({ position = MIDDLE, animated = true, post } = {}) {
    let scrollParent = jQuery(`.${layoutStyles.timeline}`);
    return new RSVP.Promise((resolve, reject) => {
      scheduleOnce('afterRender', () => {
        const timeline = scrollParent;
        if (!timeline.length) {
          return reject(new Error('No timeline'));
        }

        let timelineItem;
        if (post) {
          timelineItem = post;
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

  actions: {
    openPinnedNote(note, event) {
      /**
       * @DOCUMENTATION for `openPinnedNote`
       * written on 8 July, 2017, 4:30AM IST.
       *
       * @TERMINOLOGY
       * 'new tab' refers to app (Kayako) tabs, and not browser tabs.
       * 'journey note' refers to User or Org notes.
       * 'blip' refers to the background highlight surrounding a note that lasts a few hundred ms.
       *
       * @PARAMETERS:
       * @note: The note model object.
       * @dropdown: The ember-basic-dropdown component object.
       * @event: Javascript window event object.
       *
       * @LOGIC:
       * There are two modes of operation.
       * 1. Opening in the current tab.
       * 2. Opening in a new tab (in background).
       *
       * @VARIABLES
       * @hasModifier determines whether a meta key was pressed. If yes, the note is opened in the background (new tab).
       * @entityName is the name of the resource that the note belongs to. (Typically it's the model name in plural)
       * @modelName is the name of the model that the note belongs to. If the note was created on a user view, this value would be set to 'user'.
       * @routeName is the route to which we need to transition, if needed. This is computed based on other variables.
       * @parentRouteName is the route name of the parent of the current route the app is in. If the current route is 'session.agent.cases.case.user', the `parentRouteName` would be 'session.agent.cases.case'.
       * @postElement is the HTML element containing the note. The post element is the activity wrapper in journeys, and posts wrapper in cases.
       * @subRoute is the last segment in the route name that we want to transition to. This is one of the variables used to compute `routeName`. Its value is determined from `modelName`, or is set to 'index' if the value of `modelName` is the same as `currentParentName`.
       * @targetModelName is the name of the model we want to go to. If we are opening a note in the current tab, then `targetModelName` would be the same as the `currentParentName`. If we are opening a note in a new tab, then `targetModelName` would be the same as `modelName`.
       * @styles is the styles hash referring to timelineItemStyles or journeyTimelineItemStyles, depending on whether the current route model is a case model or not.
       * @blipElement is the HTML element that would have the blip around it.
       * @targetModel is the model object for the resource that the note belongs to. Its `resourceType` is the same as `targetModelName`, as that name is the model name of this model.
       * @modelId is the ID of the model of the current route. If we're on any of the case routes, like 'session.agent.users.user.organization', the `modelId` would have the ID for the user.
       * @currentParentName is the model name of the model for the current route that has the same ID as `modelId`.
       * @timestamp is the UNIX timestamp in seconds (moment-format 'X') for the note that we are looking for. Obtained from `note.createdAt`.
       * @currentParentModel is the model object for the model referred to by `modelId` and `currentParentName`.
       * @queryParams stores either the {postId} or {timestamp} depending on whether we're jumping to a post note, or a journey note.
       */
      const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey;

      let entityName = this.getNoteParentType(note);
      let modelName = entityName.slice(0, -1);
      let routeName, parentRouteName, postElement, subRoute, targetModelName, targetModel, styles, blipElement;
      let modelId = this.get('tabStore.activeTab.dynamicSegments.firstObject');
      let currentParentName = this.get('routing.currentRouteName').match(/([a-z]+)\.[a-z]+$/i)[1];
      let timestamp = new Date(note.get('createdAt')).getTime() / 1000;
      let currentParentModel = this.get('store').peekRecord(currentParentName, modelId);

      let queryParams = {};

      if (modelName === 'case') {
        queryParams['noteId'] = note.get('id');
        postElement = jQuery(`.${timelinePostStyles.post}[data-note-id="${note.get('id')}"]`);
        blipElement = postElement.children('div');
        styles = timelinePostStyles;
      }
      else {
        queryParams.timestamp = timestamp;
        postElement = jQuery(`.${journeyTimelineItemStyles.item}[data-created-at="${timestamp}"]`);
        blipElement = postElement;
        styles = journeyTimelineItemStyles;
      }

      subRoute = modelName;
      targetModelName = currentParentName;
      if (modelName === currentParentName) {
        subRoute = 'index';
      }
      else if (hasModifier && modelName !== currentParentName) {
        subRoute = 'index';
        targetModelName = modelName;
      }

      switch (targetModelName) {
        case 'case':
          parentRouteName = 'session.agent.cases.case'; break;
        case 'organization':
          parentRouteName = 'session.agent.organizations.organization'; break;
        case 'user':
          parentRouteName = 'session.agent.users.user'; break;
      }
      routeName = parentRouteName + '.' + subRoute;

      if (hasModifier && modelName !== currentParentName) {
        switch (modelName) {
          case 'organization':
            switch (currentParentName) {
              case 'case': targetModel = currentParentModel.get('requester.organization.content'); break;
              case 'user': targetModel = currentParentModel.get('organization.content'); break;
            } break;
          case 'user':
            switch (currentParentName) {
              case 'case': targetModel = currentParentModel.get('requester.content'); break;
            } break;
        }

        this.get('tabStore').createTabNextToActiveTab(routeName, targetModel, queryParams);
      }
      else {
        if (this.get('routing.currentRouteName') === routeName && postElement.length) {
          this.scrollTo({ post: postElement }).then(() => { this.get('_blipPost').perform(blipElement, styles); });
        }
        else {
          this.get('routing').transitionTo(routeName, [modelId], queryParams);
        }
      }
    },

    unpinNote(note, event) {
      event.preventDefault();
      event.stopPropagation();
      this.get('unpinNote').perform(note, event);
    }
  }
});
