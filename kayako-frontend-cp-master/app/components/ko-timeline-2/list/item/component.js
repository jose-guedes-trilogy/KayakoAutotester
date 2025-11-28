import Component from '@ember/component';
import { computed } from '@ember/object';
import { notEmpty, equal, or } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { stripDomainFromLinkHrefs, linkify } from 'frontend-cp/helpers/ko-linkify';
import { imagify } from 'frontend-cp/helpers/ko-imagify';
import moment from 'moment';
import { task } from 'ember-concurrency';
import { get } from '@ember/object';
import {
  POST_STATUS_CLIENT_WAITING,
  POST_STATUS_CLIENT_SENDING,
  POST_STATUS_CLIENT_FAILED
} from 'frontend-cp/models/post';
import { replaceMention, extractMentions, replaceMentionsWithPlainText } from 'frontend-cp/lib/at-mentions';
import styles from './styles';
import sanitizeConfig from 'frontend-cp/sanitizers/server-html-content';
import { sanitize } from 'ember-sanitize/utils/sanitize';

const PREVIOUS_JOINED_PROP_DEPENDENT_KEYS = [
  '{event,previousEvent}.destinationMedium',
  '{event,previousEvent}.original.postType',
  '{event,previousEvent}.creator.id',
  '{event,previousEvent}.createdAt',
  '{event,previousEvent}.original.isPinned',
  '{event,previousEvent}.original.note.isPinned'
];

const NEXT_JOINED_PROP_DEPENDENT_KEYS = [
  '{event,nextEvent}.destinationMedium',
  '{event,nextEvent}.original.postType',
  '{event,nextEvent}.creator.id',
  '{event,nextEvent}.createdAt',
  '{event,nextEvent}.original.isPinned',
  '{event,nextEvent}.original.note.isPinned'
];



export default Component.extend({
  tagName: '',

  // Attributes
  event: null,
  posts: null,
  parent: null,
  isReplyDisabled: false,
  canReplyToPost: false,
  canResend: true,
  isCasePage: false,
  replyingTo: false,
  isOrgOrUserNote: false,
  isItemMenuOpen: false,
  onReplyWithQuote: () => {},
  onAddCC: null,
  onResend: () => {},
  onItemMenuOpen: () => {},

  // State
  originalEmailView: false,
  originalEmailHtmlContent: null,
  showModal: false,
  showHtmlReplies: false,

  // Services
  store: service(),
  notification: service(),
  session: service(),
  i18n: service(),
  errorHandler: service(),

  // Lifecycle Hooks
  didReceiveAttrs() {
    this._super(...arguments);
    let emailInboundHtmlSetting = this.get('store').peekAll('setting').findBy('key', 'email.email_inbound_html');

    this.set('showHtmlReplies', emailInboundHtmlSetting ? emailInboundHtmlSetting.get('toBoolean') : false);
  },

  // CPs
  isNote: or('isPostTypeNote', 'isOrgOrUserNote', 'isSideConversation'),
  notePinnedBy: or ('event.original.pinnedBy', 'event.original.note.pinnedBy'),
  isPostTypeNote: equal('event.original.postType', 'note'),
  isSideConversation: equal('event.original.postType', 'side_conversation'),
  isUserAgentAvailable: notEmpty('event.metadata.user_agent'),
  isPageUrlAvailable: notEmpty('event.metadata.page_url'),
  isWaiting: equal('event.postStatus', POST_STATUS_CLIENT_WAITING),
  isSending: equal('event.postStatus', POST_STATUS_CLIENT_SENDING),
  isFailed: equal('event.postStatus', POST_STATUS_CLIENT_FAILED),
  isRateLimited: equal('event.postRateLimited', true),
  userAgent: computed('event.metadata.user_agent', function() {
    return this.get('event.metadata.user_agent');
  }),
  pageUrl: computed('event.metadata.page_url', function() {
    let result = this.get('event.metadata.page_url');
    // If scheme is absent then prepend it to the url
    if (!result.match(/^[a-zA-Z]+:\/\//)) {
      result = 'http://' + result;
    }

    return result;
  }),

  pinTooltipText: computed('isNotePinned', function () {
    const i18n = this.get('i18n');
    let isPinned = this.get('isNotePinned');
    let modelName = this.get('event.original.object.name');
    let pinMode = isPinned ? 'unpin' : 'pin';

    switch (modelName) {
      case 'user': return i18n.t(`generic.${pinMode}.user`);
      case 'organization': return i18n.t(`generic.${pinMode}.org`);
      default: return i18n.t(`generic.${pinMode}.case`);
    }
  }),

  qaClass: computed('event', 'isNote', function() {
    // for user & org feeds
    if (this.get('isNote')) {
      return 'qa-feed_item--note';
    }

    // for case feeds
    let postType = this.get('event.sourceChannel.channelType');
    switch (postType) {
      case 'NOTE':
        return 'qa-feed_item--note';
      case 'TWITTER':
        return 'qa-feed_item--twitter-post';
      case 'HELPCENTER':
        return 'qa-feed_item--helpcenter-post';
      default:
        return 'qa-feed_item--post';
    }
  }),

  postTypeIsEmail: computed('event.sourceChannel.channelType', 'event.destinationMedium', function() {
    const postType = this.get('event.sourceChannel.channelType');
    const medium = this.get('event.destinationMedium');
    return (postType === 'MAIL' || postType === 'MAILBOX') && (!medium || medium === 'MAIL');
  }),

  isInboundEmail: computed('postTypeIsEmail', 'event.destinationMedium', function() {
    return this.get('postTypeIsEmail') && !this.get('event.destinationMedium');
  }),

  viaTranslationKey: computed('event.sourceChannel.channelType', 'event.original.postType', 'isNote', 'isMessenger', function() {
    const postType = this.get('event.sourceChannel.channelType');
    const originalPostType = this.get('event.original.postType');

    if (this.get('isMessenger')) {
      return 'messenger';
    }

    // for user & org feeds
    if (this.get('isNote')) {
      return 'note';
    }

    // for case feeds
    switch (postType) {
      case 'TWITTER':
        return (originalPostType === 'twitterMessage') ? 'twitter_dm' : 'twitter';
      case 'HELPCENTER':
        return 'help_center';
      case 'CHAT':
      case 'MESSAGE':
      case 'MESSENGER':
        return 'messenger';
      case 'MAILBOX':
      case 'MAIL':
        return 'mail';
      case 'FACEBOOK':
        return 'facebook';
      default:
        return 'none';
    }
  }),

  isMessenger: computed('event.sourceChannel.channelType', 'event.destinationMedium', function() {
    return this.get('event.sourceChannel.channelType') === 'MESSENGER' || this.get('event.destinationMedium') === 'MESSENGER';
  }),

  isNotePinned: computed.or('event.original.isPinned', 'event.original.note.isPinned'),

  bodyHtml: computed.or('event.original.note.bodyHtml','event.original.bodyHtml'),
  bodyText: computed.or('event.original.note.bodyText', 'event.contents'),

  postItem: computed.or('event.original.note', 'event'),
  atMentionsSupported: computed('isNote', 'isOrgOrUserNote', function() {
    let { isNote, isOrgOrUserNote } = this.getProperties('isNote', 'isOrgOrUserNote');
    let isConversationNote = isNote && !isOrgOrUserNote;

    return isConversationNote;
  }),

  showTextReplies: computed.not('showHtmlReplies'),

  eventContents: computed('bodyHtml', 'bodyText', 'atMentionsSupported', 'isInboundEmail', 'showHtmlReplies', function () {
    if (this.get('showHtmlReplies') && this.get('isInboundEmail') && this.get('bodyHtml')) {
      let bodyHtml = this.get('bodyHtml');
      let content = stripDomainFromLinkHrefs(bodyHtml);

      content = imagify([content]);

      return { content: content.string };
    } else {
      let { bodyHtml, bodyText } = this.getProperties('bodyHtml', 'bodyText');
      bodyHtml = this._sanitizeContent(bodyHtml);
      let postType = this.get('event.original.postType') || this.get('event.original.note.postType');
      let eventCreatorIsCollaboratorOrHigher = this.get('event.creator.role.isCollaboratorOrHigher');

      if (['message', 'note', 'side_conversation'].includes(postType) && bodyHtml && eventCreatorIsCollaboratorOrHigher) {
        let content = stripDomainFromLinkHrefs(bodyHtml);
        content = imagify([content]);
        content.string = content.string.split('<a ').join('<a target="_blank" ');

        if (postType === 'side_conversation') {
          let bodyText = this.get('event.original.firstMessage.bodyText');
          let subject = this.get('event.original.firstMessage.subject');
          let sideConversationText = bodyText.replace(/(\r\n|\n|\r)/gm, ' ');
          if (sideConversationText.length > 100) {
            sideConversationText = sideConversationText.substring(0, 100) + '...';
          }
          content.string = '<b>' + subject + '</b><br />' + sideConversationText;
        }

        if (this.get('atMentionsSupported')) {
          return this._handleContentWithMentionSupport(content.string);
        } else {
          return this._handleContentWithoutMentionSupport(content.string);
        }
      } else {
        bodyText = bodyText.replace(/src="data:text\/html;base64,([^"]*)"/gm, "src=''");
        let contents = linkify([bodyText]);
        contents = imagify([contents.string]);
        contents = Ember.Handlebars.Utils.escapeExpression(contents);
        contents = contents.replace(/(\r\n|\n|\r)/gm, '<br />');
        return { content: stripDomainFromLinkHrefs(contents) };
      }
    }
  }),

  _extractMentions(content) {
    return extractMentions(content);
  },

  _sanitizeContent(content) {
    return sanitize(content, sanitizeConfig);
  },

  _replaceMentionsWithWormhole(html, mention) {
    return replaceMention(html, mention.id, `<div id="${mention.id}" class="${styles['mention-wormhole']}"/>`);
  },

  _handleContentWithMentionSupport(content) {
    let mentions = this._extractMentions(content);

    content = this._sanitizeContent(content);

    content = mentions.reduce(this._replaceMentionsWithWormhole, content);

    return { content, mentions };
  },

  _handleContentWithoutMentionSupport(content) {
    content = replaceMentionsWithPlainText(content);

    content = this._sanitizeContent(content);

    return { content };
  },

  previousEvent: computed('posts.[]', function() {
    const { event, posts } = this.getProperties('event', 'posts');
    const index = posts.indexOf(event);
    return posts.objectAt(index - 1);
  }),

  nextEvent: computed('posts.[]', function() {
    const { event, posts } = this.getProperties('event', 'posts');
    const index = posts.indexOf(event);
    return posts.objectAt(index + 1);
  }),

  isJoinedWithPrevious: computed(...PREVIOUS_JOINED_PROP_DEPENDENT_KEYS, function() {
    const { previousEvent, event } = this.getProperties('previousEvent', 'event');
    return this.isJoined(previousEvent, event);
  }),

  isJoinedWithNext: computed(...NEXT_JOINED_PROP_DEPENDENT_KEYS, function() {
    const { nextEvent, event } = this.getProperties('nextEvent', 'event');
    return this.isJoined(event, nextEvent);
  }),

  previousIsSameSourceNote: computed(...PREVIOUS_JOINED_PROP_DEPENDENT_KEYS, function() {
    const { previousEvent, event } = this.getProperties('previousEvent', 'event');
    return this.isJoinedNote(previousEvent, event);
  }),

  nextIsSameSourceNote: computed(...NEXT_JOINED_PROP_DEPENDENT_KEYS, function() {
    const { nextEvent, event } = this.getProperties('nextEvent', 'event');
    return this.isJoinedNote(event, nextEvent);
  }),

  isJoined(previousEvent, nextEvent) {
    if (!previousEvent || !nextEvent) {
      return false;
    }

    if (Boolean(previousEvent.get('original.isPinned')) !== Boolean(nextEvent.get('original.isPinned'))) {
      return false;
    }
    if (Boolean(previousEvent.get('original.note.isPinned')) !== Boolean(nextEvent.get('original.note.isPinned'))) {
      return false;
    }

    // are they types that can be joined?

    if (!this.isValidType(previousEvent, nextEvent, ['note', 'chat', 'message'])) {
      return false;
    }

    // are they both the same type?

    if (!this.isSameType(previousEvent, nextEvent)) {
      return false;
    }

    // were they delivered by the same medium?

    if (previousEvent.get('destinationMedium') !== nextEvent.get('destinationMedium')) {
      return false;
    }

    // are they by the same person?

    const previousCreatedBy = previousEvent.get('creator.id');
    const createdBy = nextEvent.get('creator.id');

    if (previousCreatedBy !== createdBy) {
      return false;
    }

    // are they posted within 5 minutes of each other?

    const previousCreatedAt = previousEvent.get('createdAt');
    const createdAt = nextEvent.get('createdAt');
    const diff = moment(createdAt).diff(previousCreatedAt, 'minutes');
    return diff <= 5;
  },

  isJoinedNote(previousEvent, nextEvent) {
    if (!previousEvent || !nextEvent) {
      return false;
    }

    const bothEventsAreDirectlyNotes = previousEvent.get('original.postType') === 'note' && nextEvent.get('original.postType') === 'note';
    const bothEventsContainNotes = previousEvent.get('original.note.postType') === 'note' && nextEvent.get('original.note.postType') === 'note';

    const neitherEventIsNoteRelatedInTheSameWay = !bothEventsAreDirectlyNotes && !bothEventsContainNotes;
    if (neitherEventIsNoteRelatedInTheSameWay) {
      return false;
    }

    // There are 3 states possible. undefined, 'user', and 'org...'. It's undefined when it's a case note.
    const bothEventsBelongToTheSameSource = previousEvent.get('original.object.name') === nextEvent.get('original.object.name');
    if (!bothEventsBelongToTheSameSource) {
      return false;
    }

    if (Boolean(previousEvent.get('original.isPinned')) !== Boolean(nextEvent.get('original.isPinned'))) {
      return false;
    }

    if (Boolean(previousEvent.get('original.note.isPinned')) !== Boolean(nextEvent.get('original.note.isPinned'))) {
      return false;
    }

    return true;
  },

  isValidType(previousEvent, nextEvent, types) {
    const previousEventType = previousEvent.get('original.postType') || previousEvent.get('original.note.postType');
    const nextEventType = nextEvent.get('original.postType') || nextEvent.get('original.note.postType');

    if (previousEvent.get('isViaEmail') || nextEvent.get('isViaEmail')) {
      //the only events with a type of message that are valid to join are messenger messages
      return false;
    }

    return types.includes(previousEventType) && types.includes(nextEventType);
  },

  isSameType(previousEvent, nextEvent) {
    //User and org notes can only be differentiated by checking the activity
    let previousType = this.supportMessenger1and2(previousEvent.get('original.postType')) ||
      previousEvent.get('original.activity');
    let type = this.supportMessenger1and2(nextEvent.get('original.postType')) ||
      nextEvent.get('original.activity');
    return previousType === type;
  },

  supportMessenger1and2(currentEvent) {
    //Messenger 2
    if (currentEvent === 'message') {
      return 'chat';
    }

    //Messenger 1
    return currentEvent;
  },

  toggleNotePin: task(function * (entity, activity) {
    let note, entityId, pinNote, user, errMessage;
    let entityName = this.get('event.original.object.name');

    switch (entityName) {
      case 'organization':
        entityId = entity.get('requester.organization.id');
        entityName = 'organizations';
        break;
      case 'user':
        entityId = entity.get('requester.id');
        entityName = 'users';
        break;
      default:
        entityId = entity.get('id');
        entityName = 'cases';
    }

    if (activity.get('postType') === 'note') {
      note = activity.get('content');
    } else {
      note = activity.get('note.content');
    }

    this.get('parent.viewNotes').addObject(note);
    pinNote = !note.get('isPinned');

    try {
      if (pinNote) {
        user = this.get('session.user');
      }
      note.setProperties({ isPinned: pinNote, pinnedBy: user });
      yield note.save({ adapterOptions: { entityName, entityId } });
    }
    catch (e) {
      if (pinNote) {
        errMessage = 'generic.pin_failed';
      } else {
        errMessage = 'generic.unpin_failed';
      }

      note.rollbackAttributes();

      this.get('notification').error(this.get('i18n').t(errMessage));
    }
  }).drop(),

  fetchOriginalEmailContents: task(function * () {
    let { store, event } = this.getProperties('store', 'event');

    yield this.get('errorHandler').disableWhile(() => {
      return store.findRecord('email-original', get(event, 'id'))
        .then(email => {
          let content = get(email, 'htmlContent');

          if (content) {
            this.set('originalEmailHtmlContent', content);
            this.set('originalEmailView', true);
          }
        }, ({ errors }) => {
          if (errors && errors[0] && errors[0].code === 'RESOURCE_NOT_FOUND') {
            this.set('errorType', 404);
          } else {
            this.set('errorType', 500);
          }
        });
    });
  }),

  actions: {
    onMenuOpen(isOpen) {
      this.set('isThisMenuOpen', isOpen);
      this.sendAction('onItemMenuOpen', isOpen);
    }
  }
});
