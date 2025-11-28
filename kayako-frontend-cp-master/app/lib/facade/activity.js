import EmberObject from '@ember/object';
import moment from 'moment';
import { computed } from '@ember/object';
import { notEmpty, not, or, reads, match, bool, equal, gt } from '@ember/object/computed';
import { assign } from '@ember/polyfills';

export default EmberObject.extend({

  activity: null,

  // Activity Type CP's
  isEvent: notEmpty('activity.apiEvent.event'),
  isOrgOrUserNote: notEmpty('activity.note.bodyText'),
  isLarge: or('isBreach', 'isTrashed', 'isRestored', 'isRating', 'isCompletedWithNoOtherUpdates'),
  isStandard: not('isOrgOrUserNote', 'isLarge'),
  isMinor: computed('isTriggerMonitorSystemOrSla', 'isClosed', 'isEngagement', function() {
    return (this.get('isTriggerMonitorSystemOrSla') && !this.get('isClosed')) || (this.get('isEngagement') && !this.get('isClosed'));
  }),

  // Event CP's
  oldStyleEventUrl: notEmpty('activity.apiEvent.url'),
  newStyleEventUrl: notEmpty('activity.apiEvent.properties.url'),
  eventUrl: or('activity.apiEvent.url', 'activity.apiEvent.properties.url'),

  oldStyleEventIcon: notEmpty('activity.apiEvent.iconUrl'),
  newStyleEventIcon: notEmpty('activity.apiEvent.properties.icon_url'),
  eventIcon: or('activity.apiEvent.iconUrl', 'activity.apiEvent.properties.icon_url'),

  oldStyleEventColor: notEmpty('activity.apiEvent.color'),
  newStyleEventColor: notEmpty('activity.apiEvent.properties.color'),
  eventColor: or('activity.apiEvent.color', 'activity.apiEvent.properties.color'),

  hasValidEventColor: match('eventColor', /^#(?:[0-9a-fA-F]{3}){1,2}$/),
  hasInvalidEventColor: computed('hasValidEventColor', 'eventColor', function () {
    return this.get('eventColor') &&
      !this.get('hasValidEventColor');
  }),

  hasEventPropertySummary: bool('eventPropertySummary'),

  eventPropertySummary: or('activity.apiEvent.properties.summary', 'activity.apiEvent.properties.Summary'),

  processedEventProperties: computed('activity.apiEvent.properties', function() {
    let eventProperties = this.get('activity.apiEvent.properties');
    return assign({}, eventProperties, { summary: null, Summary: null, icon_url: null, color: null });
  }),

  // Large CP's
  isCompleted: computed('activity.verb', 'activity.activity', 'activity.actions', function () {
    return this.get('activity.verb') === 'UPDATE' &&
      this.get('activity.activity') === 'update_case' &&
      this.get('activity.actions') &&
      this.get('activity.actions').filter((action) => {
        return action.get('newValue') === 'Completed' &&
          action.get('action') === 'UPDATED' &&
          action.get('field') === 'casestatusid';
      }).length > 0;
  }),

  isCompletedAsPartOfOtherUpdates: computed('isCompleted', 'activity.actions', function () {
    return this.get('isCompleted') && this.get('activity.actions.length') !== 1;
  }),

  isCompletedWithNoOtherUpdates: computed('isCompleted', 'activity.actions', function () {
    return this.get('isCompleted') && this.get('activity.actions.length') === 1;
  }),

  isTrashed: computed('activity.verb', 'activity.activity', function () {
    return this.get('activity.verb') === 'TRASH' &&
      this.get('activity.activity') === 'update_case';
  }),

  isRestored: computed('activity.verb', 'activity.activity', 'activity.actions', function () {
    return this.get('activity.verb') === 'UPDATE' &&
      this.get('activity.activity') === 'update_case' &&
      this.get('activity.actions.firstObject.oldValue') === 'Trash' &&
      this.get('activity.actions.firstObject.newValue') === 'Active';
  }),

  isBreach: computed('activity.verb', 'activity.activity', function () {
    return this.get('activity.verb') === 'BREACH' &&
      this.get('activity.activity') === 'breach_case';
  }),

  isRating: computed('activity.verb', 'activity.activity', function () {
    return this.get('activity.verb') === 'RATE' &&
      this.get('activity.activity') === 'create_case_rating' ||
      this.get('activity.activity') === 'update_case_rating';
  }),

  largeType: computed('isBreach', 'isTrashed', 'isRestored', 'isRating', 'isCompleted', function() {
    if (this.get('isBreach')) {
      return 'breach';
    } else if (this.get('isTrashed')) {
      return 'trash';
    } else if (this.get('isRestored')) {
      return 'restored';
    } else if (this.get('isRating')) {
      return 'rating';
    } else if (this.get('isCompleted')) {
      return 'completed';
    }
  }),

  isGoodRating: computed('isRating', 'activity.object.title', function () {
    return this.get('isRating') && this.get('activity.object.title') === 'GOOD';
  }),

  isBadRating: computed('isRating', 'activity.title', function () {
    return this.get('isRating') && this.get('activity.object.title') === 'BAD';
  }),

  hasComment: bool('activity.rating.comment.length'),

  // Standard CP's
  isSearch: computed('activity.verb', 'activity.activity', function () {
    return this.get('activity.verb') === 'SEARCH' &&
      this.get('activity.activity') === 'search_helpcenter';
  }),

  isView: computed('activity.verb', 'activity.activity', function () {
    return this.get('activity.verb') === 'VIEW' &&
      this.get('activity.activity') === 'view_article';
  }),

  isComment: computed('activity.verb', 'activity.activity', function () {
    return this.get('activity.verb') === 'POST' &&
      this.get('activity.activity') === 'create_helpcenter_comment';
  }),

  isSla: computed('activity.actor.name', function () {
    return this.get('activity.actor.name') === 'SLA';
  }),

  isTrigger: computed('activity.actor.name', function () {
    return this.get('activity.actor.name') === 'trigger';
  }),

  isMonitor: computed('activity.actor.name', function () {
    return this.get('activity.actor.name') === 'monitor';
  }),

  isUserEngageActivity: computed('activity.activity', function () {
    return this.get('activity.activity') === 'engage_user';
  }),

  isEngagement: computed('activity.actor.name', function () {
    return this.get('activity.actor.name') === 'engagement_rule';
  }),

  isArticleSuggestion: equal('activity.activity', 'article_suggestion'),

  isViewSuggestedArticle: equal('activity.activity', 'view_suggested_article'),

  isSuggestionHelpful: equal('activity.activity', 'suggestion_helpful'),

  isSuggestionNotHelpful: equal('activity.activity', 'suggestion_not_helpful'),

  isSuggestionCaseCompleted: equal('activity.activity', 'suggestion_case_completed'),

  hasActor: bool('activity.actor'),

  isSystem: not('hasActor'),

  isTriggerMonitorSystemOrSla: or('isTrigger', 'isMonitor', 'isSystem', 'isSla'),

  isUpdate: computed('activity.verb', 'activity.activity', function () {
    return this.get('activity.verb') === 'UPDATE' &&
      this.get('activity.activity') === 'update_case';
  }),

  isReply: computed('activity.verb', function() {
    return this.get('activity.verb') === 'REPLY';
  }),

  isReplyToMessage: computed.equal('activity.caseMessage.postType', 'message'),

  isClosed: computed('activity.verb', 'activity.activity', 'activity.actions', function () {
    return this.get('activity.verb') === 'UPDATE' &&
      this.get('activity.activity') === 'update_case' &&
      this.get('activity.actions') &&
      this.get('activity.actions').filter((action) => {
        return action.get('newValue') === 'Closed' &&
          action.get('action') === 'UPDATED' &&
          action.get('field') === 'casestatusid';
      }).length > 0;
  }),

  isMerge: equal('activity.verb', 'MERGE'),

  hasActions: gt('activity.actions.length', 0),

  hasCard: or('hasActions', 'isEvent'),

  hasAvatar: bool('activity.actor.image'),

  hasCompletedWithinTheLast10Minutes: computed('isCompleted', 'activity.createdAt', 'serverClock.date', function() {
    return this.get('isCompleted') && moment(this.get('activity.createdAt')).add(10, 'minutes') > this.get('serverClock.date');
  }),

  isMonitorOrTrigger: or('isTrigger', 'isMonitor'),

  hasTeamChanged: computed('activity.actions', function () {
    if (!this.get('activity.actions')) {
      return false;
    }
    return this.get('activity.actions').toArray().some((action) => {
      return action.get('field') === 'assigneeteamid' &&
        action.get('newObject') !== null;
    });
  }),

  // Aliases
  actor: reads('activity.actor'),
  actorUser: reads('activity.actorUser'),
  object: reads('activity.object'),
  target: reads('activity.target'),
  rating: reads('activity.rating'),
  result: reads('activity.result'),
  apiEvent: reads('activity.apiEvent'),
  summary: reads('activity.summary'),
  activityActions: reads('activity.actions'),
  kase: reads('activity.case')
});
