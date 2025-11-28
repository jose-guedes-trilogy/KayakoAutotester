import { next, throttle } from '@ember/runloop';
import Ember from 'ember';
import { variation } from 'ember-launch-darkly';
import { InvalidError } from 'ember-data/adapters/errors';
import { task, timeout } from 'ember-concurrency';
import EmberObject from '@ember/object';
import { isBlank, isEmpty } from '@ember/utils';
import _ from 'npm:lodash';
import he from 'npm:he';
import {
  stripFormattingFromHTML,
  HTMLContainsFormatting
} from 'frontend-cp/lib/html-to-text';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get } from '@ember/object';
import { readOnly, alias, filterBy, bool, or } from '@ember/object/computed';
import tweetLength from 'frontend-cp/utils/tweet-length';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import { validateEmailFormat } from 'frontend-cp/utils/format-validations';
import { assign } from '@ember/polyfills';
import { list } from 'frontend-cp/utils/presence';
import { capitalize } from '@ember/string';
import { scheduleOnce, debounce } from '@ember/runloop';
import { observer } from '@ember/object';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import {
  validateTwitterHandleFormat as isTwitterHandle
} from 'frontend-cp/utils/format-validations';
import copy from 'frontend-cp/lib/copy-to-clipboard';
import diffAttrs from 'ember-diff-attrs';
import styles from './styles';
import moment from 'moment';
import ChannelFacade from 'frontend-cp/lib/facade/channel';
import { sanitize } from 'ember-sanitize/utils/sanitize';
import { replaceMentionsWithPlainText } from 'frontend-cp/lib/at-mentions';
import { EDITOR_SELECTOR } from 'frontend-cp/components/ko-text-editor/component';
import { getMetaData } from 'frontend-cp/utils/bugsnag';
import { getOwner } from '@ember/application';
import isInternalTag from '../../utils/is-internal-tag';

const KRE_ACTIVITY_DEBOUNCE = 1000 * 10;
const CUSTOMER_ROLE_ID = 4;
const KRE_END_TYPING_DEBOUNCE = Ember.testing ? 0 : 5000;
const FOCUS_DEBOUNCE_TIME = 400;

export default Component.extend(KeyboardShortcuts, {
  // Attributes
  timeline: null,
  case: null,
  postId: null,
  noteId: null,
  filter: '',
  caseFields: null,
  caseForms: null,
  priorities: [],
  statuses: [],
  types: [],
  onQueryParamsUpdate: null,
  onCaseCreate: null,
  tabId: null,
  agents: null,
  teams: null,
  tabsComponent: null,
  hasUnreadMessages: false,
  tabsModel: null,
  instantEntityTerm: '',
  instantEntityResults: null,
  setOrganizationMode: false,
  setRequesterMode: false,
  unsetOrgInProgress: false,
  removedOrg: null,
  isBeingCreated: false,
  isBreached: false,
  isRequesterOnline: null,
  isImageUploading: false,
  isSideConversationPanelOpen: false,
  currentSideConversation: null,

  // State
  state: null,
  isTyping: false,

  // HTML
  classNames: ['ko-case-content'],
  localClassNames: ['root'],

  // Services
  store: service(),
  socket: service(),
  i18n: service(),
  plan: service(),
  permissionService: service('permissions'),
  notification: service('notification'),
  customFieldsList: service('custom-fields/list'),
  apiAdapter: service('api-adapter'),
  sessionService: service('session'),
  confirmation: service(),
  mergeConversation: service(),
  uploadService: service('fileUpload'),
  serverClock: service(),
  routing: service('-routing'),
  notificationCenter: service(),

  keyboardShortcuts: {
    'ctrl+alt+r': {
      action: 'openReply',
      global: false,
      preventDefault: true
    },
    'ctrl+alt+n': {
      action: 'openNote',
      global: false,
      preventDefault: true
    },
    r: {
      action: 'openReply',
      global: false
    },
    n: {
      action: 'openNote',
      global: false
    },
    s: {
      action: 'editSubject',
      global: false
    },
    'ctrl+alt+s': {
      action: 'editSubject',
      global: false,
      preventDefault: true
    },
    'mod+enter': {
      action: 'submit',
      global: true,
      preventDefault: true
    }
  },

  // Lifecycle hooks
  didReceiveAttrs: diffAttrs('case', 'tabId', function(changedAttrs, ...args) {
    this._super(...args);

    if (!changedAttrs || changedAttrs.case) {
      this.get('reloadRequester').perform();

      this.get('suggestPeople').cancelAll();
      this.get('typing').cancelAll();
      this.get('serverClock').restartRunningTick();

      if (!this.get('case.isNew')) {
        this.get('fetchNotes').perform();
        this.get('getBrands').perform();
      }

      this._markNotificationAsRead();
      this.get('state.initChannels').perform();

      next(() => {
        this.setTabsModelRequester();
        this.setChannelWhenRequesterPresent();
        this.focusSubjectOrReply();
      });
    }
  }),

  willDestroyElement () {
    this.updatePresenceMeta(this.get('case'), { is_foreground: false });
  },

  requesterChanged: observer('editedCase.requester', function () {
    this.setChannelWhenRequesterPresent();
  }),

  // State attributes
  postContent: readOnly('state.postContent'),
  attachedPostFiles: readOnly('state.attachedPostFiles'),
  channel: readOnly('state.channel'),
  posts: readOnly('state.posts'),
  errorMap: readOnly('state.errorMap'),
  singlePropertyUpdating: bool('state.setBrand.isRunning'),
  isSaving: computed('state.{arePropertiesEdited,isSaving}', 'hasUpdateSendingOperations', function() {
    let isStateSaving = this.get('state.isSaving');
    let propertiesAreEdited = this.get('state.arePropertiesEdited');
    let hasSendingOperations = this.get('timeline.sendingOperations.length');
    let hasUpdateSendingOperations = this.get('hasUpdateSendingOperations');

    return (propertiesAreEdited && hasSendingOperations) || hasUpdateSendingOperations || isStateSaving;
  }),

  hasUpdateSendingOperations: computed('timeline.sendingOperations.@each.code', function() {
    let sendingOperations = this.get('timeline.sendingOperations') || [];
    return sendingOperations.any(op => op.code !== 'reply');
  }),

  replyOptions: readOnly('state.replyOptions'),
  editedTags: readOnly('state.editedTags'),
  propertiesChangeViaKRE: readOnly('state.propertiesChangeViaKRE'),
  editedCase: readOnly('state.editedCase'),
  viewingUsers: readOnly('state.viewingUsers'),
  requester: readOnly('state.editedCase.requester'),
  uploadingFiles: readOnly('uploadService.uploadFile.isRunning'),
  selectedNoteDestination: readOnly('state.noteDestination'),
  atMentionsSupported: readOnly('state.atMentionsSupported'),

  noteDestinations: computed('hasOrg', function() {
    const i18n = this.get('i18n');
    let options = [
      {
        id: 'case',
        text: i18n.t('cases.conversation'),
        description: i18n.t('generic.texteditor.case_notes_reminder')
      },
      {
        id: 'user',
        text: i18n.t('users.title'),
        description: i18n.t('generic.texteditor.user_notes_reminder')
      }
    ];

    if (this.get('hasOrg')) {
      options.addObject(
        {
          id: 'org',
          text: i18n.t('organization.title'),
          description: i18n.t('generic.texteditor.org_notes_reminder')
        }
      );
    }

    return options;
  }),

  noteDestination: or('selectedNoteDestination', 'noteDestinations.firstObject'),

  updateLog: computed('state.updateLog.[]', function() {
    const userId = this.get('sessionService.user.id');

    return this.get('state.updateLog').filter((update) => {
      return update.get('user.id') !== userId;
    });
  }),

  isSlaCompleted: computed('case.slaMetrics', 'isSaving', function() {
    return this.get('relavantSla.stage') === 'COMPLETED';
  }),

  slaBarStatus: computed('isSlaCompleted', 'isSlaPaused', 'isBreached', 'isSaving', 'case.slaMetrics', function() {
    if (this.get('case.slaMetrics').isAny('stage', 'PAUSED')) {
      return 'paused';
    }
    if (this.get('isSlaCompleted') && this.get('isBreached')) {
      return 'completedAndBreached';
    }
    if (this.get('isSlaCompleted')) {
      return 'completed';
    }
    if (this.get('isBreached')) {
      return 'bad';
    }
    return 'active';
  }),

  slaIcon: computed('slaBarStatus', function () {
    switch (this.get('slaBarStatus')) {
      case 'paused':
        return 'pause';
      case 'completed':
        return 'tick';
      case 'completedAndBreached':
        return 'tick';
      default:
        return 'clock';
    }
  }),

  metricString: computed('isBreached', function () {
    if (this.get('isBreached')) {
      return 'cases.sla.phrase.bad';
    }

    return 'cases.sla.in';
  }),

  sortedMetrics: computed('case.slaMetrics', function() {
    const metrics = this.get('case.slaMetrics');

    const completed = metrics.filter((metric) => {
      return metric.get('isCompleted') && moment(metric.get('dueAt')).isAfter(moment(metric.get('completedAt')));
    }).sort((metric) => {
      return moment(metric.get('completedAt')).diff(moment(metric.get('dueAt')));
    });

    const completedAndBreached = metrics.filter((metric) => {
      return metric.get('isCompleted') && moment(metric.get('completedAt')).isAfter(moment(metric.get('dueAt')));
    }).sort((metric) => {
      return moment(metric.get('completedAt')).diff(moment(metric.get('dueAt')));
    });

    const incomplete = metrics.rejectBy('isCompleted').sortBy('dueAt');
    return incomplete.concat(completedAndBreached.concat(completed));
  }),

  relavantSla: computed('case.slaMetrics', function() {
    return this.get('sortedMetrics.firstObject');
  }),

  creatorIdentityTwitterHandle: computed('editedCase.identity', function() {
    const identity = this.get('editedCase.identity');

    if (!identity) {
      return '';
    }

    return identity.constructor.modelName !== 'identity-twitter' ? '' : identity.get('screenName');
  }),

  fetchNewerPostsAfterReply: task(function * () {
    if (this.isDestroyed || this.isDestroying) {
      return [];
    }

    let filter = this.get('filter');

    this._defaultToReplyingToTheLastMessageFromTheCustomer();
    return yield this.get('timeline.fetchNewerAfterReply').perform(filter);
  }),

  typingString: computed('channelPresence', 'sessionService.user.id', function () {
    const presence = this.get('channelPresence');
    if (!presence) { return null; }

    const metas = list(presence, (id, { metas }) => {
      return assign({}, metas[0], {
        is_typing: metas.any(m => m.is_typing)
      });
    });

    const userID = this.get('sessionService.user.id');

    const users = metas
      .filter(m => m.user)
      .filter(m => String(m.user.id) !== userID)
      .filter(m => m.is_typing)
      .map(m => m.user.full_name);

    const numUsers = users.length;

    if (!numUsers) {
      return null;
    }

    const lastUser = numUsers > 1 ? users.pop() : null;

    return this.get('i18n').t('cases.realtimeTyping', {
      total: numUsers,
      lastUser: lastUser,
      sentence: users.join(', ')
    });
  }),

  triggerActivity() {
    this.updatePresenceMeta(this.get('case'), { is_updating: this.get('state.isEdited') });
    this.legacyTriggerActivity();
  },

    // TODO - remove this once Android/iOS clients stop relying on it
  legacyTriggerActivity() {
    const id = this.get('sessionService.user.id');
    const data = {
      id,
      isUpdating: this.get('state.isEdited')
    };

    const channelName = this.get('case.realtimeChannel');
    if (this.get('socket').hasJoinedChannel(channelName)) {
      this.get('socket').push(channelName, 'client-activity', data);
    }
  },

  mouseMove(event) {
    throttle(this, this.triggerActivity, KRE_ACTIVITY_DEBOUNCE);
  },

  // CPs
  hasUser: computed.bool('editedCase.requester'),
  hasOrg: computed.or('editedCase.requester.organization.name', 'removedOrg'),
  hasSubject: computed.notEmpty('editedCase.subject'),
  caseSubject: computed('editedCase.subject', function() {
    return he.unescape(this.get('editedCase.subject'));
  }),

  showTabs: computed('hasUser', 'setRequesterMode', 'setOrganizationMode', 'tabsModel.organization.name', function() {
    return !this.get('setRequesterMode') && this.get('hasUser') && (!this.get('setOrganizationMode') || this.get('tabsModel.organization.name'));
  }),

  showSendButton: computed('addExternalNote.isRunning', 'hasReplyContent', 'hasUpdateSendingOperations', 'canUpdateAndResend', 'isImageUploading', function () {
    const addExternalNoteisRunning = this.get('addExternalNote.isRunning');
    const hasReplyContent = this.get('hasReplyContent');
    const hasUpdateSendingOperations = this.get('hasUpdateSendingOperations');
    const canUpdateAndResend = this.get('canUpdateAndResend');
    const isImageUploading = this.get('isImageUploading');

    return (addExternalNoteisRunning || hasReplyContent || hasUpdateSendingOperations) && !canUpdateAndResend && !isImageUploading;
  }),

  completedStatus: computed('statuses.[]', function () {
    return this.get('statuses').findBy('statusType', 'COMPLETED');
  }),

  canTrashCase: computed('isBeingCreated', function () {
    const permission = this.get('permissionService').has('cases.trash');

    return !this.get('isBeingCreated') && permission;
  }),

  canMergeCase: computed(function() {
    return this.get('permissionService').has('cases.merge');
  }),

  createMenuItem(menu, value, action, args, children = []) {
    return {
      id: menu ? menu.length + 1 : null,
      value,
      object: {
        action, args
      },
      children : children.length ? children : null
    };
  },

  navigationMenuItems: computed('isCaseClosed', 'isBeingCreated', 'areFieldsDisabled', 'canMergeCase', 'isCaseTrashed', 'canTrashCase', 'filter', 'caseBrandName', 'enabledBrands', 'case.brand', function () {
    const i18n = this.get('i18n');

    const { isCaseClosed,
            isBeingCreated,
            areFieldsDisabled,
            canMergeCase,
            isCaseTrashed,
            canTrashCase,
            filter,
            caseBrandName,
            enabledBrands
          } = this.getProperties('isCaseClosed', 'isBeingCreated', 'areFieldsDisabled', 'canMergeCase', 'isCaseTrashed', 'canTrashCase', 'filter', 'caseBrandName', 'enabledBrands');

    let menu = [];

    if (!isCaseClosed) {
      if (!areFieldsDisabled) {
        menu.push(this.createMenuItem(menu, i18n.t('cases.change_requester'), this, ['setRequesterModeOn']));
      }
      if (canMergeCase && !isCaseTrashed) {
        menu.push(this.createMenuItem(menu, i18n.t('cases.merge_conversation.title'), this.get('state.mergeCase').perform));
      }
    }
    if (!isBeingCreated) {
      if (canTrashCase && isCaseTrashed) {
        menu.push(this.createMenuItem(menu, i18n.t('cases.restore'), this.get('state.restoreCase').perform));
      }
      if (filter === 'messages') {
        menu.push(this.createMenuItem(menu, i18n.t('cases.filter_options.posts_activities'), this, ['setFilter', 'all']));
      }
      else {
        menu.push(this.createMenuItem(menu, i18n.t('cases.filter_options.posts'), this, ['setFilter', 'messages']));
      }
      if (enabledBrands.length > 1 && this.get('isAgentOrHigher')) {
        const sortedBrands = enabledBrands.sortBy('name');
        menu.push(this.createMenuItem(null, `${i18n.t('generic.change_brand')}<span>&nbsp;- ${sanitize(caseBrandName)}</span>`, null, null,
          sortedBrands
            .map((brand) => {
              return this.createMenuItem(menu, {
                text: sanitize(brand.get('name')),
                isSelected: brand.get('id') === this.get('case.brand.id'),
                isDefault: brand.get('isDefault')
              }, this.get('setBrand').perform, [brand]);
            })
        ));
      }
    }

    return menu;
  }),

  twitterReplyOptions: computed('creatorIdentityTwitterHandle', function() {
    const handle = this.get('creatorIdentityTwitterHandle');
    const i18n = this.get('i18n');

    return [
      {
        id: 'tweet.public',
        type: 'REPLY',
        text: i18n.t('cases.tweet.public')
      },
      {
        id: 'tweet.public-invite-dm',
        type: 'REPLY_WITH_PROMPT',
        text: i18n.t('cases.tweet.public-invite-dm'),
        description: i18n.t('cases.tweet.public-invite-dm-description', { handle })
      },
      {
        id: 'tweet.dm',
        type: 'DM',
        text: i18n.t('cases.tweet.dm')
      }
    ];
  }),

  twitterReplyValue: computed('replyOptions.type', function() {
    let optionState = this.get('replyOptions');
    let twitterReplyOptions = this.get('twitterReplyOptions');

    let option = twitterReplyOptions.find((replyOption) => {
      return replyOption.type === optionState.get('type');
    });

    if (!option) {
      return twitterReplyOptions.get('firstObject');
    }

    return option;
  }),

  macros: computed(function () {
    return this.get('store').peekAll('macro');
  }),

  enabledCaseForms: computed('caseForms.[]', function () {
    return this.get('caseForms').filterBy('isEnabled').filterBy('isDeleted', false);
  }),

  isRichFormattingAvailable: computed('channel', 'channel.isChannelTypeMailbox', function() {
    return this.get('channel.channelType') === 'NOTE' || this.get('channel.isChannelTypeMailbox');
  }),

  tags: computed('case.tags.@each.name', function() {
    return this.get('case.tags').map(tag => tag.get('name'));
  }),

  publicReplyChannels: computed('case.replyChannels', function() {
    return this.get('case.replyChannels').filter((channel) => {
      return channel.get('channelType') !== 'NOTE';
    });
  }),

  hasRequesterBeenSeenRecently: computed('editedCase.requester.lastSeenAt', 'isRequesterOnline', 'serverClock.date', function() {
    if (this.get('isRequesterOnline')) {
      return true;
    }

    let lastSeenAt = this.get('editedCase.requester.lastSeenAt');
    let serverTime = this.get('serverClock.date');
    let aboutFifteenMinutesAgo = serverTime.clone().subtract(18, 'minutes'); // 15 mins plus a small buffer to account for server caching

    return moment.utc(lastSeenAt).isAfter(aboutFifteenMinutesAgo);
  }),

  lastMessageSentViaMessenger: computed('timeline.lastMessage.destinationMedium', 'timeline.lastMessage.sourceChannel.channelType', function() {
    let lastMessage = this.get('timeline.lastMessage');
    if (!lastMessage) {
      return false;
    }

    return lastMessage.get('destinationMedium') === 'MESSENGER' || lastMessage.get('sourceChannel.channelType') === 'MESSENGER';
  }),

  wrappedPublicReplyChannels: computed('publicReplyChannels', 'hasRequesterBeenSeenRecently', 'lastMessageSentViaMessenger', function() {
    let channels = this.get('publicReplyChannels');
    let isOnline = this.get('hasRequesterBeenSeenRecently') && this.get('lastMessageSentViaMessenger');

    return channels.map(channel => ChannelFacade.create({ channel, isOnline }));
  }),

  wrappedSelectedChannel: computed('state.publicChannel', 'wrappedPublicReplyChannels', function() {
    let channel = this.get('state.publicChannel');

    if (!channel) {
      return;
    }

    let wrappedChannels = this.get('wrappedPublicReplyChannels');
    return wrappedChannels.findBy('id', channel.get('id'));
  }),

  editorClass: computed('wrappedSelectedChannel.shouldDeliverViaMessenger', 'state.isNote', 'atMentionsSupported', function() {
    const channel = this.get('wrappedSelectedChannel');
    const isNote = this.get('state.isNote');

    if (this.get('atMentionsSupported')) {
      return 'at-mentions-supported';
    }

    if (!channel || isNote) {
      return;
    }

    if (channel.get('shouldDeliverViaMessenger')) {
      return 'channel-type--messenger';
    }

    return `channel-type--${channel.get('normalizedType')}`;
  }),

  showAllCustomFields: computed('case.isNew', function() {
    return !variation('release-sidebar-compaction') || this.get('case.isNew');
  }),

  caseOrFormFields: computed('caseFields', 'editedCase.form', 'showAllCustomFields', function () {
    let caseFields = this.get('caseFields');
    let form = this.get('editedCase.form');

    let fields = form ? form.get('fields') : caseFields.sortBy('sortOrder');
    if (!this.get('showAllCustomFields')) {
      let customFieldValues = this.get('state.customFields.idToEditedValueHash');
      fields = fields.filter(field => {
        return field.get('isSystem') || field.get('isRequiredForAgents') || !isEmpty(customFieldValues[field.get('id')]);
      });
    }

    return fields;
  }),

  emptyFieldCount: computed('caseOrFormFields', function () {
    if (!variation('release-sidebar-compaction')) return 0;

    let caseFields = this.get('caseFields');
    let form = this.get('editedCase.form');
    let fields = form ? form.get('fields') : caseFields.sortBy('sortOrder');
    let customFieldValues = this.get('state.customFields.idToEditedValueHash');
    fields = fields.filter(field => {
      return !field.get('isSystem') && !field.get('isRequiredForAgents') && isEmpty(customFieldValues[field.get('id')]) && field.get('isEnabled');
    });

    return fields.length;
  }),

  showFormBottomArrow: computed('caseOrFormFields', function () {
    if (!variation('release-sidebar-compaction')) return true;

    let caseFields = this.get('caseFields');
    let form = this.get('editedCase.form');
    let fields = form ? form.get('fields') : caseFields.sortBy('sortOrder');
    let customFields = fields.filter(field => {
      return !field.get('isSystem') && !field.get('isRequiredForAgents') && field.get('isEnabled');
    });

    return this.get('showAllCustomFields') || customFields.length !== this.get('emptyFieldCount');
  }),

  statusField: computed('caseOrFormFields.[]', function () {
    return this.get('caseOrFormFields').findBy('fieldType', 'STATUS');
  }),

  typeField: computed('caseOrFormFields.[]', function () {
    return this.get('caseOrFormFields').findBy('fieldType', 'TYPE');
  }),

  priorityField: computed('caseOrFormFields.[]', function () {
    return this.get('caseOrFormFields').findBy('fieldType', 'PRIORITY');
  }),

  assigneeField: computed('caseOrFormFields.[]', function () {
    return this.get('caseOrFormFields').findBy('fieldType', 'ASSIGNEE');
  }),

  caseBrandName: alias('case.brand.name'),

  hasBrand: computed('caseBrand.companyName', function () {
    return Boolean(this.get('caseBrand.companyName'));
  }),

  brands: readOnly('getBrands.lastSuccessful.value'),

  enabledBrands: filterBy('getBrands.lastSuccessful.value', 'isEnabled'),

  hasChannel: computed('case.sourceChannel.channelType', function() {
    return !!(this.get('case.sourceChannel.channelType'));
  }),

  isCaseClosed: computed.equal('case.status.statusType', 'CLOSED'),

  isCaseCompleted: computed.equal('case.status.statusType', 'COMPLETED'),

  isCaseTrashed: computed.equal('case.state', 'TRASH'),

  isPristine: computed.not('state.isEdited'),
  isReplyBlank: computed.not('hasReplyContent'),
  hasReplyContent: computed.reads('state.isContentEdited'),

  isTwitterDm: computed('twitterReplyValue', function() {
    return ['tweet.public', 'tweet.public-invite-dm'].indexOf(this.get('twitterReplyValue.id')) === -1;
  }),

  hasTextLimit: computed('channel.channelType', 'isTwitterDm', function() {
    return this.get('channel.channelType') === 'TWITTER' && !this.get('isTwitterDm');
  }),

  maxCharaterCountReached: computed('hasTextLimit', 'replyCharactersCount', function () {
    return this.get('hasTextLimit') && this.get('replyCharactersCount') < 0;
  }),

  isInvalid: computed.readOnly('maxCharaterCountReached'),

  isCollaborator: computed.not('sessionService.user.role.isAgentOrHigher'),
  isAgentOrHigher: computed.readOnly('sessionService.user.role.isAgentOrHigher'),

  areFieldsDisabled: computed(
    'canUpdateAndResend',
    'isSaving',
    'isCaseTrashed',
    'isCaseClosed',
    'isCollaborator',
    'singlePropertyUpdating',
  function() {
    if (this.get('canUpdateAndResend')) {
      return false;
    }

    return this.get('isSaving') ||
           this.get('isCaseTrashed') ||
           this.get('singlePropertyUpdating') ||
           this.get('isCaseClosed') ||
           this.get('isCollaborator');
  }),

  canUpdateAndResend: computed.and('hasErrors', 'hasQueue'),

  hasErrors: computed('errorMap', function() {
    let errorMap = this.get('errorMap');

    if (!errorMap) {
      return false;
    }

    return Object.keys(errorMap).some(key => errorMap.get(key));
  }),
  hasQueue: computed.notEmpty('timeline.sendingOperations'),

  noUser: computed.not('hasUser'),

  isReplyDisabled: computed.or('isSaving', 'isCaseTrashed', 'isCaseClosed', 'isCollaborator'),

  submitDisabled: computed.or(
    'isSaving',
    'isPristine',
    'isCaseTrashed',
    'isCaseClosed',
    'isInvalid',
    'hasNoRequester',
    'state.reloadCase.isRunning',
    'uploadingFiles'
  ),

  hasNoRequester: computed.not('editedCase.requester'),

  replyCharactersCount: computed('postContent', 'attachedPostFiles.@each.error', 'channel.characterLimit', function() {
    let characterLimit = this.get('channel.characterLimit');
    let files = this.get('attachedPostFiles').filter((file) => file.error !== 'TOO_LARGE');
    return characterLimit - tweetLength(this.get('postContent'), files.length);
  }),

  planHasAgentCollisions: computed(function() {
    return this.get('plan').has('agent_collision');
  }),

  composeReplyDisabled: computed.or('hasUpdateSendingOperations', 'state.update.isRunning', 'canUpdateAndResend'),

  submitReplyDisabled: computed.or(
    'composeReplyDisabled',
    'uploadingFiles',
    'isReplyBlank',
    'singlePropertyUpdating',
    'addExternalNote.isRunning',
    'unsetOrgInProgress'
  ),

  isShowingControls: computed('channel.channelType', function() {
    return ['MAIL', 'NOTE'].includes(this.get('channel.channelType')) || !this.get('channel.channelType');
  }),

  supportsAttachments: computed('channel.channelType', function () {
    return this.get('channel') && this.get('channel.channelType') !== 'FACEBOOK';
  }),

  dropzoneError: computed('supportsAttachments', function () {
    if (!this.get('channel')) {
      return this.get('i18n').t('generic.uploads.no_channel');
    }
    if (this.get('channel.channelType') === 'FACEBOOK') {
      return this.get('i18n').t('generic.uploads.facebook_not_allowed');
    }
  }),

  filteredStatuses: computed('case.id', 'statuses.[]', 'editedCase.status', function() {
    let caseIsPersisted = !(this.get('isBeingCreated'));
    const currentStatus = this.get('editedCase.status');

    return this.get('statuses').filter(status => {

      // statuses can only be NEW if they've never been saved
      if (status.get('statusType') === 'NEW') {
        return !caseIsPersisted || currentStatus === status;
      }

      return status.get('statusType') !== 'CLOSED' && !status.get('isDeleted');
    });
  }),

  orderedStatuses: computed('filteredStatuses.@each.sortOrder', function() {
    return this.get('filteredStatuses').sortBy('sortOrder');
  }),

  orderedStatusesExcludingCurrent: computed('orderedStatuses.[]', 'editedCase.status', function() {
    let currentStatus = this.get('editedCase.status');
    let orderedStatuses = this.get('orderedStatuses');

    return orderedStatuses.filter(caseStatus => {
      if (caseStatus.get('label') !== currentStatus.get('label')) {
        return caseStatus;
      }
    });
  }),

  isLoading: computed('state.initChannels.{last,isRunning}', function() {
    let task = this.get('state.initChannels');

    return !task.get('last') || task.get('isRunning');
  }),

  messengerHelpText: computed('wrappedSelectedChannel.shouldDeliverViaMessenger', 'editedCase.requester', 'state.isNote', function() {
    let channel = this.get('wrappedSelectedChannel');
    let requester = this.get('editedCase.requester');
    let inMessengerMode = channel && channel.get('shouldDeliverViaMessenger') && !this.get('state.isNote');

    if (requester && inMessengerMode) {
      return this.get('i18n').t('cases.messenger_mode', { email: channel.get('handle'), name: requester.get('fullName') });
    }
  }),

  visibleTags: computed('editedTags.@each.name', function() {
    return this.get('editedTags').filter(tag => {
      return !isInternalTag(tag);
    });
  }),

  // Methods
  getBrands: task(function * () {
    return yield this.get('store').findAll('brand');
  }),

  suggestTags: task(function * (searchTerm) {
    yield timeout(300);
    const addNewMessage = this.get('i18n').t('generic.addtagname', { tag: searchTerm });
    const data = yield this.get('store').query('tag', { name: searchTerm });
    const exactMatch = !!data.toArray().findBy('name', searchTerm) || !!this.get('editedTags').findBy('name', searchTerm);

    return _.difference(data.mapBy('name'), this.get('editedTags').mapBy('name'))
      .map(name => ({ name }))
      .concat(exactMatch ? [] : [{ name: addNewMessage, actualName: searchTerm }]);
  }).restartable(),

  findAndTriggerFroalaFocusAction() {
    if (this.isDestroying || this.isDestroyed) { return; }
    this.$(EDITOR_SELECTOR).froalaEditor('events.focus');
  },

  focusFroalaEditor() {
    scheduleOnce('afterRender', this, 'findAndTriggerFroalaFocusAction');
  },

  // Tasks
  openNote: task(function * () {
    let state = this.get('state');

    state.setNote();

    if (variation('release-reply-all-by-default')) {
      state.removeInReplyTo();
    }

    this.focusFroalaEditor();
  }).drop(),

  setChannel: task(function * (newChannel, force, event) {
    const state = this.get('state');
    const currentChannelType = this.get('channel.channelType');
    const newChannelType = newChannel.get('channelType');
    const content = state.get('postContent');

    if (HTMLContainsFormatting(content) && currentChannelType !== newChannelType && ['TWITTER', 'FACEBOOK'].indexOf(newChannelType) > -1) {
      yield this.get('confirmation').confirm({
        intlConfirmationHeader: 'cases.channel.confirm.sanitize_text_header',
        intlConfirmationBody: 'cases.channel.confirm.sanitize_text'
      });
      const sanitized = stripFormattingFromHTML(content);
      state.setPostContent(sanitized);
    }
    state.setChannel(newChannel);

    if (force) {
      if (event) {
        event.preventDefault();
      }
      this.focusFroalaEditor();
    }
    else {
      this.focusSubjectOrReply();
    }

    if (currentChannelType !== 'MAIL') {
      this._defaultToReplyingToTheLastMessageFromTheCustomer();
    }
  }).drop(),

  replyToPost: task(function * (post) {
    let channel = post.get('sourceChannel');
    let state = this.get('state');
    let conversationRequester = this.get('case.requester');

    if (channel && this.get('publicReplyChannels').findBy('id', channel.get('id'))) {
      yield this.get('setChannel').perform(channel);
      state.setInReplyTo(post);
    } else {
      yield this.get('setChannel').perform(this.get('state.publicChannel'));
    }

    this._setCCs(post, conversationRequester);
    this.focusFroalaEditor();
  }).drop(),

  create: task(function * () {
    try {
      const model = this.get('case');
      yield this.get('state.create').perform();
      this.get('case.requester.recentCases').reload();
      this.attrs.onCaseCreate(model);
    } catch (e) {
      if (!(e instanceof InvalidError)) {
        throw e;
      }
    }
  }).drop(),

  enqueueReply: task(function * () {
    let shouldDeliverViaMessenger = this.get('wrappedSelectedChannel.shouldDeliverViaMessenger');
    let meta = { shouldDeliverViaMessenger };
    yield this.get('state.enqueueReply').perform(meta);
    this.focusFroalaEditor();
    this.triggerActivity();
  }),

  reply: task(function * () {
    try {
      yield this.get('state.legacyReply').perform(this.get('timeline'));
      this.get('serverClock').restartRunningTick();
      this.focusFroalaEditor();
      this.triggerActivity();
      let post = yield this.get('fetchNewerPostsAfterReply').perform();
      this.addNoteToViewNotesIfInNotesMode(post);
    } catch (e) {
      if (!(e instanceof InvalidError)) {
        throw e;
      }
    }
  }).drop(),

  updateProperties: task(function * () {
    try {
      yield this.get('state').get('update').perform();
      this.get('serverClock').restartRunningTick();
      this.triggerActivity();
      yield this.get('fetchNewerPostsAfterReply').perform();
    } catch (e) {
      if (!(e instanceof InvalidError)) {
        throw e;
      }
    }
  }).drop(),

  updateAndResend: task(function * () {
    yield this.get('state.updateAndResend').perform();
  }).drop(),

  suggestPeople: task(function * (address) {
    const mailboxAddresses = this.get('store').peekAll('channel').filterBy('isChannelTypeMailbox').getEach('handle');
    const trimmedAddress = address.trim();
    const isAMailboxAddress = mailboxAddresses.includes(trimmedAddress);

    if (isBlank(trimmedAddress) || isAMailboxAddress) {
      return [];
    }
    yield timeout(300);
    const selectedPeople = this.get('replyOptions.cc');
    const idsToExclude = [...selectedPeople, ...mailboxAddresses];

    const data = yield this.get('store').query('identity-autocomplete-email', {
      address: trimmedAddress
    });

    // Remove any already selected or mailbox emails from results list
    const results = data.filter(
      autocomplete => !idsToExclude.includes(autocomplete.get('identity.email'))
    );

    const isValidEmail = validateEmailFormat(trimmedAddress);
    const enteredCcIsNotSelectedOrMailboxEmail = !idsToExclude.includes(trimmedAddress);
    const autocompleteResultIsNotTheSameAsEnteredCc = !results.mapBy('identity.email').includes(trimmedAddress);

    if (isValidEmail && enteredCcIsNotSelectedOrMailboxEmail && autocompleteResultIsNotTheSameAsEnteredCc) {
      results.unshift(EmberObject.create({
        isNew: true,
        identity: {
          email: trimmedAddress
        }
      }));
    }

    return results;
  }).restartable(),

  loadMacros: computed.readOnly('state.loadMacrosLazily'),

  typing: task(function * (text) {
    const kase = this.get('case');

    if (isBlank(text)) {
      this._stoppedTyping(kase);

      return;
    }

    try {
      this._startedTyping(kase);
      yield timeout(KRE_END_TYPING_DEBOUNCE);
      this._stoppedTyping(kase);
    } catch (e) {
      // noop
    } finally {
      if (this.get('isDestroying') || this.get('case.id') !== kase.get('id')) {
        this._stoppedTyping(kase);
      }
    }
  }).restartable(),

  fetchNotes: task(function * () {
    try {
      let notes = yield this.get('store').query('note', {
        parent: this.get('case'),
        limit: 999
      });
      this.set('case.viewNotes', notes.toArray());
    }
    catch (e) {
      if (!Ember.testing && window.Bugsnag) {
        let context = getMetaData(null, getOwner(this));
        window.Bugsnag.notifyException(e, 'Failed to fetch notes', context, 'info');
      }
    }
  }).restartable(),

  _startedTyping(kase) {
    // Messenger shouldn't indicate if an agent/admin is typing an internal note.
    if (!this.get('isTyping') && !this.get('state.isNote')) {
      this.set('isTyping', true);
      this.updatePresenceMeta(kase, { is_typing: true });
      this.sendTypingEvent(kase, 'client-start_typing');
    }
  },

  _stoppedTyping(kase) {
    if (this.get('isTyping')) {
      this.set('isTyping', false);
      this.updatePresenceMeta(kase, { is_typing: false });
      this.sendTypingEvent(kase, 'client-stop_typing');
    }
  },

  updatePresenceMeta(kase, updates = {}) {
    const caseChannelName = kase.get('realtimeChannel');
    if (!caseChannelName) {
      return;
    }

    const socket = this.get('socket');
    if (!this.get('socket').hasJoinedChannel(caseChannelName)) {
      return;
    }

    const meta = assign({ last_active_at: new Date().getTime() }, updates);
    socket.push(caseChannelName, 'update-presence-meta', meta);
  },

  // TODO - remove this once Android/iOS clients stop relying on it
  sendTypingEvent (kase, event) {
    const realtimeChannel = kase.get('realtimeChannel');
    if (!this.get('socket').hasJoinedChannel(realtimeChannel)) {
      return;
    }

    const eventPayload = {
      id: this.get('sessionService.user.id'),
      full_name: this.get('sessionService.user.fullName'),
      avatar: this.get('sessionService.user.avatar')
    };

    this.get('socket').push(realtimeChannel, event, eventPayload);
  },

  createUser: task(function * (name, id, isTwitter) {
    let store = this.get('store');

    let roleModel = yield store.findRecord('role', CUSTOMER_ROLE_ID);

    let userObject = {
      role: roleModel,
      fullName: name
    };

    let email, twitter;
    if (!isTwitter) {
      email = store.createRecord('identity-email', {
        isPrimary: true,
        email: id
      });

      userObject.emails = [email];

      return yield store.createRecord('user', userObject).save();
    }
    else {
      let user = yield store.createRecord('user', userObject).save();

      twitter = yield store.createRecord('identity-twitter', {
        user: user,
        isPrimary: true,
        screenName: id
      }).save();

      user.set('twitter', [twitter]);

      return user;
    }

  }).drop(),

  createOrg: task(function * (name) {
    let store = this.get('store');

    return yield store.createRecord('organization', { name }).save();
  }).drop(),

  getChannel: task(function * (user) {
    if (this.get('case.isNew')) {
      let userId = user.get('id');
      let store = this.get('store');
      let data = yield store.query('channel', { user_id: userId });

      this.set('case.replyChannels', data);
    } else {
      yield this.get('case.replyChannels').reload();
    }

    yield this.get('state.initChannels').perform();

    this.focusFroalaEditor();
  }).restartable(),

  setChannelWhenRequesterPresent() {
    let kase = this.get('case');
    let requester = this.get('editedCase.requester');

    if (!requester) {
      return;
    }

    if (kase === this._previousCase && requester === this._previousRequester) {
      return;
    }
    this._previousCase = kase;
    this._previousRequester = requester;

    this.get('getChannel').perform(requester);
    this.set('tabsModel.requester', requester);
  },

  setTabsModelRequester() {
    this.set('tabsModel.requester', this.get('editedCase.requester'));
  },

  focusInstantSearch() {
    if (this.isDestroying || this.isDestroyed) { return; }
    this.$(`#${this.get('elementId')}-kie-instant-input`).click();
  },

  findAndClickOnSubjectField() {
    if (this.isDestroying || this.isDestroyed) { return; }
    this.$(`.${styles['timeline-header-body']}`).find('span:not(.ember-view)').click();
  },

  focusSubject() {
    scheduleOnce('afterRender', this, 'findAndClickOnSubjectField');
  },

  scheduleCheckingForEditableActiveElement(force) {
    let subject = this.get('editedCase.subject');

    let el = document.activeElement;
    let isCurrentElementEditable = el && (el.isContentEditable || el.tagName.toUpperCase() === 'INPUT' || el.tagName.toUpperCase() === 'TEXTAREA');

    let selection = document.getSelection();
    let isDocumentTextSelected = !!(selection.focusOffset - selection.anchorOffset);

    if ((!isCurrentElementEditable && !isDocumentTextSelected) || force) {
      if (typeof subject === 'string' && !subject.trim().length && this.get('editedCase.requester')) {
        this.focusSubject();
      }
      else {
        this.focusFroalaEditor();
      }
    }
  },

  focusSubjectOrReply(force) {
    scheduleOnce('afterRender', this, 'scheduleCheckingForEditableActiveElement', force);
  },

  resetEntityParams(doSetOrg, doSetReq) {
    this.set('instantEntityTerm', '');
    this.set('instantEntityResults', null);
    this.set('setOrganizationMode', !!doSetOrg);
    this.set('setRequesterMode', !!doSetReq);
  },

  handleRequesterChangeFailure(oldRequester) {
    const state = this.get('state');
    const i18n = this.get('i18n');

    state.setRequester(oldRequester);
    this.set('tabsModel.requester', oldRequester);
    this.setChannelWhenRequesterPresent();
    this.get('notification').error(i18n.t('cases.requester_assignment_failed'));
  },

  applyRequesterAndChannel(requester) {
    const state = this.get('state');
    state.setRequester(requester);
    this.set('tabsModel.requester', requester);
    this.setChannelWhenRequesterPresent();
  },

  addNoteToViewNotesIfInNotesMode(post) {
    if (this.get('state.isNote')) {
      // The case timeline consists of `post`s that can wrap `note`s, `reply`-ies and `activity`-ies.
      post = post.get('firstObject.original.content') || post;
      if (post) {
        this.get('case.viewNotes').addObject(post);
      }
    }
  },

  persistOrgToUser: task(function * (user, org) {
    let i18n = this.get('i18n');
    user.set('organization', org);
    let opts = {adapterOptions: {setOrganization: true}};

    try {
      yield user.save(opts);

      this.send('setInstantUser', user);

      let message = i18n.t('organization.assignment_passed', {
        name: user.get('fullName'),
        org: org.get('name')
      });

      this.get('notification').success(message);
    } catch (error) {
      this.get('notification').error(i18n.t('organization.assignment_failed'));
      user.set('organization', null);
    }
  }).drop(),

  reloadRequester: task(function * () {
    let requester = yield this.get('editedCase.requester');
    if (requester && !requester.get('isReloading') && !requester.get('isSaving')) {
      yield requester.reload();
    }
  }).drop(),

  setBrand: task(function * (brand) {
    yield this.get('state.setBrand').perform(brand);
    this.get('getChannel').perform(this.get('case.requester'));
  }),

  addExternalNote: task(function * (destination) {
    const user = this.get('case.requester.id');
    const organization = this.get('case.requester.organization.id');
    let postContent = this.get('postContent');
    let atMentionsSupported = this.get('atMentionsSupported');

    if (!atMentionsSupported) {
      postContent = replaceMentionsWithPlainText(postContent);
    }

    const payload = {
      contents: postContent,
      attachmentFileIds: this.get('attachedPostFiles').mapBy('attachmentId').compact()
    };

    const type = destination === 'user' ? 'user' : 'organization';

    try {
      let post = yield this.get('store').createRecord('note', payload).save({adapterOptions: { type, user, organization }});
      if (this.get('state.arePropertiesEdited')) {
        yield this.get('state.update').perform();
      }
      this.get('state').resetReplyBox();
      yield this.get('fetchNewerPostsAfterReply').perform();
      this.addNoteToViewNotesIfInNotesMode(post);
    } catch (e) {
      if (!(e instanceof InvalidError)) {
        throw e;
      }
    }
  }),

  submitCreate() {
    if (this.get('submitDisabled')) {
      return;
    }

    this.get('create').perform();
  },

  submitReply() {
    if (this.get('submitReplyDisabled')) {
      return;
    }
    this._stoppedTyping(this.get('case'));
    this.get('enqueueReply').perform();
  },

  submitUpdate() {
    if (this.get('submitDisabled')) {
      return;
    }

    this._stoppedTyping(this.get('case'));
    this.get('updateProperties').perform();
  },

  _markNotificationAsRead() {
    const notificationId = Number(this.get('routing.router.router.state.fullQueryParams.notificationId'));

    if (notificationId && !isNaN(notificationId)) {
      this.get('notificationCenter').markAsRead(notificationId);
    }
  },

  _defaultToReplyingToTheLastMessageFromTheCustomer() {
    if (!variation('release-reply-all-by-default')) {
      return;
    }

    if (this.get('isCaseClosed') || this.get('isCaseTrashed')) {
      return;
    }

    let lastMessageFromACustomer = this.get('timeline.lastMessageFromACustomer');
    let isNote = this.get('state.isNote');
    let shouldDeliverViaMessenger = this.get('wrappedSelectedChannel.shouldDeliverViaMessenger');
    let state = this.get('state');

    if (!isNote &&
      !shouldDeliverViaMessenger &&
      lastMessageFromACustomer &&
      lastMessageFromACustomer.get('sourceChannel') &&
      lastMessageFromACustomer.get('sourceChannel.channelType') === 'MAIL'
    ) {
      if (!state.isCCActive) {
        let conversationRequester = this.get('case.requester');
        state.setInReplyTo(lastMessageFromACustomer);
        if (!state.get('replyOptions.cc.length')) {
          this._setCCs(lastMessageFromACustomer, conversationRequester);
        }
      }
    }

    this.send('dispatch', 'inferStateFromLatestPosts', this.get('state.posts'));
  },

  _setCCs(post, requester) {
    if (post.get('original.postType') !== 'message') {
      return;
    }

    let state = this.get('state');
    let mailboxAddresses = [];
    let ccs = [];

    let recipients = post.get('original.recipients');
    let postCreatorEmails = post.get('creator.emails') ? post.get('creator.emails').mapBy('email') : [];
    let postOriginalEmail = post.get('original.email');
    let requesterEmailObjects = requester.get('emails');
    let requesterEmails = requesterEmailObjects ? requesterEmailObjects.map(emailIdentity => emailIdentity.get('email')) : [];
    let primaryRequesterEmail = requesterEmailObjects ? requesterEmailObjects.filterBy('isPrimary').get('firstObject.email') : null;

    this.get('brands').forEach( brand => {
      mailboxAddresses.push(...brand.get('mailboxes').mapBy('address'));
    });

    state.setCCs([]);

    if (recipients) {
      const recipientsToBeAddedAsCCs = recipients.filter(recipient =>
        !postCreatorEmails.includes(recipient.get('identity.email')) &&
        !mailboxAddresses.includes(recipient.get('identity.email'))
      );

      ccs = recipientsToBeAddedAsCCs.getEach('identity.email');
    }

    if (!requesterEmails.includes(postOriginalEmail)) {
      if (primaryRequesterEmail) {
        ccs.push(primaryRequesterEmail);
      }
      if (!ccs.includes(postOriginalEmail) && !mailboxAddresses.includes(postOriginalEmail)) {
        ccs.push(postOriginalEmail);
      }
    }

    state.setCCs(ccs);
  },

  // Actions
  actions: {
    dispatch(method, ...rest) {
      if (method === 'setPostContent') {
        this.get('typing').perform(...rest);
      }
      this.get('state')[method](...rest);
    },

    setImageUploadStatus(status){
      this.set('isImageUploading', status);
    },

    setTwitterType({ type }) {
      this.get('state').setTwitterType(type);
    },

    setNoteDestination(destination) {
      this.get('state').setNoteDestination(destination);
      debounce(this, 'focusSubjectOrReply', FOCUS_DEBOUNCE_TIME);
    },

    setFilter(filter) {
      this.get('onQueryParamsUpdate')({ filter, postId: null, noteId: null });
    },

    onAttachFiles(files) {
      const service = this.get('uploadService');
      const attachedPostFiles = this.get('attachedPostFiles');
      const channel = this.get('channel');
      const onUploadAttachmentStart = (...args) => this.get('state').addAttachment(...args);
      const onUploadAttachment = (...args) => this.get('state').updateAttachments(...args);
      files.forEach(file =>
        service.get('uploadFile').perform(file, attachedPostFiles, channel, onUploadAttachmentStart, onUploadAttachment).catch(() => { /* Swallow this as this isn't an error we can handle */})
      );
    },

    openNote(event) {
      if (event) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }

      this.get('openNote').perform();
    },

    quote(post) {
      const sanitizedContent = he.escape(post.get('contents'));
      const quotedContent = sanitizedContent.split('\n').map(line => '> ' + line).join('<br>');
      this.get('state').appendPostContent('<br>' + quotedContent);
      this.focusFroalaEditor();
    },

    copyLink(url) {
      copy(`${window.location.protocol}//${window.location.host}${url}`);
      this.get('notification').success(this.get('i18n').t('generic.copied_to_clipboard'));
    },

    openReply(force, event) {
      let publicChannel = this.get('state.publicChannel');

      if (publicChannel) {
        this.get('setChannel').perform(publicChannel, force, event);
      } else {
        this.set('state.isNote', false);
        this.get('state.initChannels').perform();
      }
    },

    setChannel(wrappedChannel) {
      this.get('setChannel').perform(wrappedChannel.get('channel'));
    },

    submit() {
      const destination = this.get('noteDestination.id');
      if (this.get('isBeingCreated')) {
        this.submitCreate();
      } else if (this.get('state').hasReply()) {
        switch(destination) {
          case 'user':
          case 'org':
            this.get('addExternalNote').perform(destination);
            break;
          default: this.submitReply();
        }
      } else {
        this.submitUpdate();
      }
    },

    sendAndSet(selectedState) {
      this.send('dispatch', 'setStatus', selectedState);
      this.send('submit');
    },

    editSubject: function () {
      this.focusSubject();
    },

    handleTabbingFromSubject(event) {
      let subject = this.get('editedCase.subject');
      this.get('state').setSubject(subject);

      if ([KeyCodes.tab, KeyCodes.enter].includes(event.keyCode)) {
        event.preventDefault();
        this.focusFroalaEditor();
      }
    },

    handleTabbingFromReply(event) {
      if (event.keyCode === KeyCodes.tab) {
        event.preventDefault();

        if (this.get('editedCase.requester')) {
          this.focusSubject();
        }
        else {
          scheduleOnce('afterRender', this, 'focusInstantSearch');
        }
      }
    },

    handleInstantEntityTabbing(key) {
      if (key === 'TAB') {
        this.focusSubjectOrReply(true);
      }
    },

    setOrganizationModeOn() {
      this.resetEntityParams(true, false);
    },

    setOrganizationModeOff() {
      this.resetEntityParams();
      this.focusSubjectOrReply(true);
    },

    setRequesterModeOn(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.resetEntityParams(false, true);
    },

    setRequesterModeOff() {
      this.resetEntityParams();
      this.focusSubjectOrReply(true);
    },

    setInstantUser(user) {
      const caseExists = this.get('case.id');
      const oldRequester = this.get('editedCase.requester');
      const i18n = this.get('i18n');

      if (typeof user === 'string') {
        user = user.trim();

        // Create User flow
        let isTwitter = isTwitterHandle(user);

        if (isTwitter) {
          user = user.slice(1);
        }
        let name;
        let id = user;

        let username = id;

        if (!isTwitter) {
          username = id.slice(0, id.indexOf('@'));
        }

        if (username.indexOf('+') !== -1) {
          username = username.slice(0, username.indexOf('+'));
        }

        let [firstName, lastName] = username.split('.');
        name = capitalize(firstName);
        if (lastName && lastName.trim().length) {
          name += ' ' + capitalize(lastName);
        }

        this.get('createUser').perform(name, id, isTwitter)
          .then((user) => {
            this.get('notification').success(i18n.t('cases.new_conversation.user_created'));
            this.applyRequesterAndChannel(user);
            if (caseExists) {
              this.get('case').save({adapterOptions: {setRequester: true}}).catch(() => this.handleRequesterChangeFailure(oldRequester));
            }
          })
          .finally(() => {
            this.resetEntityParams();
            this.focusSubjectOrReply();
          });
      }
      else {
        this.focusSubjectOrReply();
        this.applyRequesterAndChannel(user);
        this.resetEntityParams();
        if (caseExists) {
          this.get('case').save({adapterOptions: {setRequester: true}}).catch(() => this.handleRequesterChangeFailure(oldRequester));
        }
      }
    },

    setInstantOrg(org) {
      let i18n = this.get('i18n');
      if (typeof org === 'string') {
        org = capitalize(org.trim());

        // Create Org flow
        let savePromise = this.get('createOrg').perform(org);
        savePromise.then((org) => {
          this.get('notification').success(i18n.t('organization.created'));

          let user = this.get('editedCase.requester.content') || this.get('editedCase.requester');
          this.get('persistOrgToUser').perform(user, org);
        })
          .finally(() => {
            this.resetEntityParams();
          });
      }
      else {
        this.resetEntityParams();
        let user = this.get('editedCase.requester.content') || this.get('editedCase.requester');
        this.get('persistOrgToUser').perform(user, org);
      }
    },

    updateOrgRemovalState(value, org) {
      this.set('unsetOrgInProgress', value);
      this.set('removedOrg', org);

      let selectedNoteDestinationIsOrg = this.get('selectedNoteDestination.id') === 'org';

      if (!value && !org && selectedNoteDestinationIsOrg) {
        this.get('state').setNoteDestination(this.get('noteDestinations.firstObject'));
      }
    },

    breachChange(e, value) {
      this.set('isBreached', value);
    },

    requesterPresenceChanged(data) {
      let id = this.get('editedCase.requester.id');
      let metas = data[id] && data[id].metas;
      let isOnline = !!(metas && metas.length);

      let wasOnline = this.get('isRequesterOnline');
      let hasGoneOffline = wasOnline && !isOnline;
      if (hasGoneOffline) {
        this.get('reloadRequester').perform();
      }

      this.set('isRequesterOnline', isOnline);
    },

    preserveTimer(totalSeconds, isBillable) {
      this.get('state').setTimerValue(totalSeconds, isBillable);
    },

    resetProperties() {
      this.get('state').resetSidebar();
    },

    mostRecentFetched(posts) {
      this._defaultToReplyingToTheLastMessageFromTheCustomer();
      this.send('dispatch', 'inferStateFromLatestPosts', posts);
    },

    toggleSideConversationPanel(conversation) {
      if (get(conversation, 'subject')) {
        this.set('currentSideConversation', conversation);
        this.set('isSideConversationPanelOpen', true);
      } else {
        this.toggleProperty('isSideConversationPanelOpen');
      }
    }
  }
});
