import { bool, or, notEmpty } from '@ember/object/computed';
import { isEmpty } from '@ember/utils';
import EmberObject, { observer, computed } from '@ember/object';
import { Promise } from 'rsvp';
import Ember from 'ember';
import { scheduleOnce } from '@ember/runloop';
import { task, timeout } from 'ember-concurrency';
import _ from 'npm:lodash';
import cloneDeep from 'npm:lodash/cloneDeep';
import sanitizeConfig from 'frontend-cp/sanitizers/server-html-content';
import { sanitize } from 'ember-sanitize/utils/sanitize';
import { assign } from '@ember/polyfills';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { set } from '@ember/object';
import uuid from 'npm:uuid/v4';
import Evented from '@ember/object/evented';
import { typeOf } from '@ember/utils';

import { jsonToObject } from 'frontend-cp/utils/object';
import htmlToText from 'npm:html-to-text';
import {
  formatHTMLForSendingAsHTML,
  formatHTMLForSendingAsText
} from 'frontend-cp/lib/html-to-text';
import { attr, fragment, many, model } from 'frontend-cp/services/virtual-model';
import EditedCustomFields from 'frontend-cp/lib/edited-custom-fields';
import UploadFile from 'frontend-cp/lib/upload-file';
import { extractMentions, replaceMentionsWithPlainText } from 'frontend-cp/lib/at-mentions';

import { variation } from 'ember-launch-darkly';

export const OP_STATE_WAITING = 'client-waiting';
export const OP_STATE_SENDING = 'client-sending';
export const OP_STATE_FAILED = 'client-failed';

const caseSchema = model('case', {
  subject: attr(),
  assignedTeam: attr(),
  assignedAgent: attr(),
  requester: attr(),
  status: attr(),
  caseType: attr(),
  priority: attr(),
  form: attr(),
  identity: attr(),
  organization: attr(),
  customFields: many(fragment('case-field-value', {
    field: attr(),
    value: attr()
  }))
});

const closeSchema = model('case', {
  status: attr()
});

// TODO unify
const convertErrorsToMap = (errors) => {
  return (errors || []).filter((error) => error.parameter).reduce((errorMap, error) => {
    errorMap.set(error.parameter, true);
    return errorMap;
  }, EmberObject.create({}));
};

const cleanupAttachments = (attachments) => {
  attachments.removeObjects(attachments.filter(attachment => !isEmpty(attachment.get('error'))));
  return attachments;
};

const getAssigneeFromMacro = (user, macro) => {
  switch (macro.get('assigneeType')) {
    case 'UNASSIGNED':
      return [null, null];
    case 'CURRENT_AGENT':
      return [user.get('teams.firstObject'), user];
    case 'TEAM':
      return [macro.get('assignedTeam'), macro.get('assignedAgent')];
    case 'AGENT':
      return [macro.get('assignedTeam'), macro.get('assignedAgent')];
  }
};

const formatPostForSending = (content, channel) => {
  if (channel.get('isChannelTypeMailbox') || channel.get('channelType') === 'NOTE') {
    return formatHTMLForSendingAsHTML(content);
  } else {
    return formatHTMLForSendingAsText(content);
  }
};

export default EmberObject.extend(Evented, {
  tab: null,
  model: null,
  publicChannelId: null,
  isNote: false,
  postContent: '',
  subject: '',
  attachedPostFiles: null,
  loadingTop: false,
  loadingBottom: false,
  bottomPostsAvailable: false,
  topPostsAvailable: true,
  posts: null,
  errorMap: null,
  inReplyTo: null,
  suggestedPeople: null,
  suggestedPeopleTotal: 0,
  suggestedPeopleLoading: false,
  editedCase: null,
  editedTags: null,
  replyOptions: null,
  propertiesChangeViaKRE: null,
  updateLog: null,
  viewingUsers: null,
  isCCActive: false,
  hasCCInput: false,
  requester: null,
  timerValue: null,
  isBillable: null,
  noteDestination: null,

  confirmation: service(),
  mergeConversation: service(),
  i18n: service(),
  metrics: service(),
  macro: service(),
  notification: service(),
  timeline: service(),
  store: service(),
  tabStore: service(),
  tagService: service('tags'),
  apiAdapter: service(),
  virtualModel: service(),
  session: service(),
  serverClock: service(),

  init() {
    this._super(...arguments);
    this.setProperties({
      posts: [],
      replyOptions: EmberObject.create({
        cc: [],
        type: null
      }),
      viewingUsers: []
    });
    this.initEdits();

    const savedState = jsonToObject(this.get('tab').state.case);
    const { requesterId, subject } = savedState;

    // attachments should be re-created as correct UploadFile objects
    if (savedState.attachedPostFiles) {
      savedState.attachedPostFiles = savedState.attachedPostFiles.map(attachment =>
        UploadFile.create(attachment)
      );
    }

    this.setProperties(savedState);

    if (variation('release-cc-list-improvements')) {
      // do nothing
    } else {
      if (this.get('replyOptions.cc.length')) {
        this.set('isCCActive', true);
      }
    }

    if (subject) {
      this.set('editedCase.subject', subject);
    }

    if (requesterId) {
      this.get('loadRequester').perform(requesterId).then(() => this.persistTabState());
    } else {
      this.persistTabState();
    }
    this.setParticipantsAsCCs();
  },

  loadRequester: task(function * (requesterId) {
    let store = this.get('store');
    let user = yield store.findRecord('user', requesterId);

    this.set('editedCase.requester', user);
  }),

  publicChannel: computed('publicChannelId', 'model.replyChannels.[]', function () {
    return this.get('model.replyChannels').findBy('id', this.get('publicChannelId'));
  }),

  channel: computed('publicChannel', 'isNote', 'model.replyChannels.[]', function () {
    if (this.get('isNote')) {
      return this.get('model.replyChannels').findBy('channelType', 'NOTE');
    } else {
      return this.get('publicChannel');
    }
  }),

  inReplyToPost: computed('inReplyTo.id', function () {
    const id = this.get('inReplyTo.id');
    if (id) {
      return this.get('store').find('post', id);
    } else {
      return null;
    }
  }),

  isContentEdited: computed('postContent', function () {
    let postContent = this.get('postContent');
    let trimmed = htmlToText.fromString(postContent).trim();
    return trimmed !== '';
  }),

  isSubjectEdited: computed('editedCase.subject', 'model.subject', function () {
    return this.get('model.subject') !== this.get('editedCase.subject');
  }),

  isAssigneeEdited: computed('editedCase.assignedAgent', 'model.assignedAgent',
    'editedCase.assignedTeam', 'model.assignedTeam', function () {
      return this.get('model.assignedAgent.content') !== this.get('editedCase.assignedAgent') ||
        this.get('model.assignedTeam.content') !== this.get('editedCase.assignedTeam');
    }),
  
  isOrganizationEdited: computed('editedCase.organization', 'model.organization', function () {
    return this.get('model.organization.content') !== this.get('editedCase.organization');
  }),

  isAssignedToMeBeforeEditing: computed('model.assignedAgent', function () {
    return this.get('model.assignedAgent.content.id') === this.get('session.user.id');
  }),

  isAssignedToMeAfterEdit: computed('editedCase.assignedAgent', 'session.user', function () {
    return this.get('editedCase.assignedAgent') === this.get('session.user');
  }),

  isCurrentUserInMultipleTeams: computed('session.user.teams.[]', function () {
    return this.get('session.user.teams.length') > 1;
  }),

  isStatusEdited: computed('editedCase.status', 'model.status', function () {
    return this.get('model.status.content') !== this.get('editedCase.status');
  }),

  isTypeEdited: computed('editedCase.caseType', 'model.caseType', function () {
    return this.get('model.caseType.content') !== this.get('editedCase.caseType');
  }),

  isPriorityEdited: computed('editedCase.priority', 'model.priority', function () {
    return this.get('model.priority.content') !== this.get('editedCase.priority');
  }),

  isTagsFieldEdited: computed('editedTags.@each.name', 'model.tags.@each.name', function () {
    let editedTags = this.get('editedTags').mapBy('name');
    let tags = this.get('model.tags').mapBy('name');
    return editedTags.get('length') !== tags.get('length') || tags.any(tag => !editedTags.includes(tag));
  }),

  isFormEdited: computed('editedCase.form', 'model.form', function () {
    return this.get('model.form.content') !== this.get('editedCase.form');
  }),

  hasTimerValue: bool('timerValue'),

  arePropertiesOtherThanStatusEdited: or('isSubjectEdited',
    'isAssigneeEdited', 'isTypeEdited', 'isPriorityEdited',
    'isTagsFieldEdited', 'isFormEdited', 'customFields.isEdited',
    'isOrganizationEdited'),

  arePropertiesEdited: or('arePropertiesOtherThanStatusEdited', 'isStatusEdited'),

  isOnlyStatusEdited: computed('arePropertiesOtherThanStatusEdited', 'isStatusEdited', function () {
    return !this.get('arePropertiesOtherThanStatusEdited') && this.get('isStatusEdited');
  }),

  isEdited: or('arePropertiesEdited', 'isContentEdited', 'hasTimerValue'),

  // We have to set this magic property, because after
  // save/restore stte operation, computed property will
  // stop updating.
  isEditedChanged: observer('isEdited', function () {
    scheduleOnce('sync', this, 'persistTabState');
  }),

  timelineForModel: computed('timeline', 'model', function() {
    return this.get('timeline').timelineForCase(this.get('model'));
  }),

  atMentionsSupported: computed('isNote', 'noteDestination', function () {
    let isNote = this.get('isNote');
    let destination = this.get('noteDestination.id') || 'case';
    let isConversationNote = (isNote && destination === 'case');

    return isConversationNote;
  }),

  hasEnqueuedOperations: notEmpty('timelineForModel.sendingOperations'),

  isSaving: or('create.isRunning', 'update.isRunning', 'legacyReply.isRunning',
    'performTrashCase.isRunning', 'restoreCase.isRunning', 'completeAndClose.isRunning',
    'hasEnqueuedOperations'),

  initEdits() {
    const model = this.get('model');
    let editedCase = this.get('virtualModel').makeSnapshot(model, caseSchema);

    this.setProperties({
      editedCase,
      errorMap: EmberObject.create(),
      attachedPostFiles: [],
      propertiesChangeViaKRE: EmberObject.create({
        customFields: EmberObject.create()
      }),
      inReplyTo: EmberObject.create({ id: null, uuid: null }),
      postContent: '',
      noteDestination: null,
      subject: this.get('subject'),
      customFields: EditedCustomFields.create({
        originalCustomFields: this.get('model.customFields'),
        editedCustomFields: editedCase.get('customFields')
      }),
      editedTags: this.get('model.tags').map(tag => EmberObject.create({
        name: tag.get('name'),
        isKREEdited: false,
        isNew: false,
        tagtype: tag.get('tagtype')
      })),
      updateLog: [],
      isCCActive: false,
      requester: editedCase.get('requester')
    });
    this.set('replyOptions.cc', []);
  },

  resetReplyBox() {
    this.setProperties({
      attachedPostFiles: [],
      inReplyTo: EmberObject.create({ id: null, uuid: null }),
      postContent: '',
      isCCActive: false,
      noteDestination: null,
    });
    this.set('replyOptions.cc', []);
  },

  setParticipantsAsCCs() {
    const caseId = this.get('model.id');
    if (caseId) {
      return this.get('store').adapterFor('case').getParticipants(caseId).then(emails => {
        this.setCCs(emails);
      });
    }
    return Promise.resolve();
  },

  resetSidebar() {
    const model = this.get('model');
    let editedCase = this.get('virtualModel').makeSnapshot(model, caseSchema);

    this.setProperties({
      editedCase,
      errorMap: EmberObject.create(),
      propertiesChangeViaKRE: EmberObject.create({
        customFields: EmberObject.create()
      }),
      customFields: EditedCustomFields.create({
        originalCustomFields: this.get('model.customFields'),
        editedCustomFields: editedCase.get('customFields')
      }),
      editedTags: this.get('model.tags').map(tag => EmberObject.create({
        name: tag.get('name'),
        isKREEdited: false,
        isNew: false,
        tagtype: tag.get('tagtype')
      })),
      updateLog: []
    });
  },

  persistTabState() {
    this.get('tabStore').updateState(this.get('tab'), {
      case: assign(this.getProperties(
        'subject',
        'postContent',
        'publicChannelId',
        'isNote',
        'inReplyTo',
        'attachedPostFiles',
        'replyOptions',
        'timerValue',
        'isBillable',
        'noteDestination'
      ), {
        requesterId: this.get('editedCase.requester.id'),
        _isEdited: this.get('isEdited')
      })
    });
  },

  loadPosts({ model, filter, postId }) {
    this.set('posts', []);
    this.set('topPostsAvailable', true);
    this.set('bottomPostsAvailable', Boolean(postId));

    return this.loadPostsAbove({ model, filter, postId: postId || null, including: true })
      .catch(e => {
        // if we've failed to load posts because the postID refers to a post which doesn't exist
        // then just pretend we weren't given an ID and start from the top
        if (postId) {
          this.set('bottomPostsAvailable', false);
          return this.loadPostsAbove({ model, filter, postId: null, including: true });
        } else {
          throw e;
        }
      });
  },

  loadPostsAbove({ model, filter, postId, including }) {
    return this.get('timeline').loadPostsAbove(this, { model, filter, postId, including });
  },

  loadPostsBelow({ model, filter, postId }) {
    return this.get('timeline').loadPostsBelow(this, { model, filter, postId });
  },

  refreshTags: task(function * (model) {
    yield model.get('tags').reload();
    model.set('tags', model.get('tags').filterBy('isNew', false));
  }).enqueue(),

  refreshNotes: task(function * () {
    try {
      let notes = yield this.get('store').query('note', {
        parent: this.get('model'),
        limit: 999
      });
      this.set('model.viewNotes', notes.toArray());
      this.get('store').pushPayload(notes);
    }
    catch (e) {
      if (!Ember.testing && window.Bugsnag) {
        window.Bugsnag.notifyException(e, 'Failed to refresh notes', {}, 'info');
      }
    }
  }).restartable(),

  completeAndClose: task(function * (completedStatus) {
    const model = this.get('model');
    const editedCase = this.get('virtualModel').makeSnapshot(model, closeSchema);
    editedCase.set('status', completedStatus);
    yield this.get('virtualModel').save(model, editedCase, closeSchema);
    this.initEdits();
    this.persistTabState();
    this.get('tabStore').close(this.get('tab'));
  }).drop(),

  addAttachment(attachment) {
    const attachments = cleanupAttachments(this.get('attachedPostFiles'));

    attachments.pushObject(attachment);
    this.set('attachedPostFiles', attachments);
    this.persistTabState();
  },

  cancelAttachment(attachment) {
    let attachments = cleanupAttachments(this.get('attachedPostFiles'));

    attachments.removeObjects(attachments.filter((a) => a === attachment));

    this.set('attachedPostFiles', attachments);
    this.persistTabState();
  },

  updateAttachments() {
    this.persistTabState();
  },

  setInReplyTo(post) {
    this.set('inReplyTo', EmberObject.create({
      uuid: post.get('uuid'),
      id: post.get('id')
    }));
    this.updateTwitterType(post.get('original.postType'));
    this.persistTabState();
  },

  removeInReplyTo() {
    this.set('inReplyTo', null);
    this.persistTabState();
  },

  updateTwitterType(postType) {
    const channel = this.get('channel');
    if (channel && channel.get('channelType') === 'TWITTER') {
      if (postType === 'twitterTweet') {
        // Twitter Public Message
        this.setTwitterType('REPLY');
      } else {
        // Twitter DM message
        this.setTwitterType('DM');
      }
    } else {
      this.setTwitterType(null);
    }
  },

  setChannel(channel) {
    this.set('publicChannelId', channel.get('id'));
    this.set('isNote', false);

    if (channel && channel.get('channelType') === 'FACEBOOK') {
      this.set('attachedPostFiles', []);
    }

    this.persistTabState();
  },

  setNote() {
    this.set('isNote', true);
    this.persistTabState();
  },

  setTimerValue(totalSeconds, isBillable) {
    this.setProperties({
      timerValue: totalSeconds,
      isBillable: isBillable
    });
    this.persistTabState();
  },

  setCCs(emails) {
    let mailboxAddresses = this.get('store').peekAll('channel').filterBy('isChannelTypeMailbox').getEach('handle');
    let hasMailboxEmail;

    emails = emails.map(email => {
      if (typeOf(email) === 'string') {
        return email;
      } else {
        return email.get('identity.email');
      }
    }).filter(email => {
      let emailIsAMailboxAddress = mailboxAddresses.includes(email);
      if (emailIsAMailboxAddress) hasMailboxEmail = true;
      return !emailIsAMailboxAddress;
    }).uniq();

    if (hasMailboxEmail) {
      this.get('notification').add({
        type: 'error',
        title: this.get('i18n').t('cases.mailbox_not_allowed_in_cc_title'),
        body: this.get('i18n').t('cases.mailbox_not_allowed_in_cc_subtitle'),
        autodismiss: true
      });
    }

    this.set('replyOptions.cc', emails);

    this._updateCCState();
  },

  addCC(emailOrIdentity) {
    let emailAddress;
    const replyEmail = this.get('inReplyToPost.original.email');
    if (typeof emailOrIdentity === 'string') {
      emailAddress = emailOrIdentity;
    } else {
      emailAddress = emailOrIdentity.get('email');
    }

    let isRequester = false;
    this.model.get('requester.emails').toArray().some((emailRecord) => {
      if (emailRecord.get('email') === emailAddress) {
        isRequester = true;
        return true;
      }
    });

    let mailboxAddresses = this.get('store').peekAll('channel').filterBy('isChannelTypeMailbox').getEach('handle');
    let emailIsAMailboxAddress = mailboxAddresses.includes(emailAddress);

    if (emailIsAMailboxAddress) {
      this.get('notification').add({
        type: 'error',
        title: this.get('i18n').t('cases.mailbox_not_allowed_in_cc_title'),
        body: this.get('i18n').t('cases.mailbox_not_allowed_in_cc_subtitle'),
        autodismiss: true
      });
    }

    if (!isRequester && emailAddress !== replyEmail && !emailIsAMailboxAddress) {
      this.get('replyOptions.cc').addObject(emailAddress);
      this._updateCCState();
    }
  },

  _updateCCState() {
    this.persistTabState();

    if (variation('ops-event-tracking')) {
      this.get('metrics').trackEvent({
        event: 'Case - Update CC recipients',
        category: 'Agent'
      });
    }
  },

  appendToUpdateLog(user, date) {
    let updateLog = this.get('updateLog');
    if (user) {
      updateLog.unshiftObject(EmberObject.create({
        user: user,
        updatedAt: date
      }));
    }
  },

  resetUpdateLog() {
    this.set('updateLog', []);
  },

  loadMacrosLazily: task(function * (model, user, macro) {
    yield macro.reload();
    this.applyMacro(model, user, macro, true);
  }).restartable(),

  applyMacro(model, user, macro, isLazy) {

    // Checking for agent to determine if the object for this ID is present in DS
    // Checking for isLazy to determine if function was called lazily and macro.get('agent') to determine if
    // macro exists because it seems that a specific macro once loaded, always has it's agent data present.
    if (!isLazy && !macro.get('agent')) {
      this.get('loadMacrosLazily').perform(model, user, macro);
      return;
    }
    const replyType = macro.get('replyType');

    if (replyType) {
      if (replyType === 'REPLY') {
        const channel = this.get('store').peekRecord('channel', this.get('publicChannelId'));
        this.setChannel(channel);
      } else {
        this.setNote();
        this.removeInReplyTo();
      }
    }

    let contentsToAdd = macro.get('replyContents');
    if (contentsToAdd) {
      this.appendPostContent(sanitize(contentsToAdd, sanitizeConfig));
    }

    const newStatus = macro.get('status');

    if (newStatus) {
      this.setStatus(newStatus);
    }

    const newPriority = macro.get('priority');

    if (newPriority) {
      this.setPriority(newPriority);
    }

    const priorityAction = macro.get('priorityAction');

    if (priorityAction) {
      const currentCase = this.get('editedCase');
      let newPriorityLevel;

      if (priorityAction === 'INCREASE_ONE_LEVEL') {
        newPriorityLevel = currentCase.get('priority.level') + 1;
      } else {
        newPriorityLevel = Math.max(1, currentCase.get('priority.level') - 1);
      }

      const newPriority = this.get('store').peekAll('case-priority').filter(priority => {
        return priority.get('level') === newPriorityLevel;
      }).get('firstObject');

      if (newPriority) {
        this.setPriority(newPriority);
      }
    }

    const newType = macro.get('caseType');

    if (newType) {
      this.setType(newType);
    }

    const newAssignee = getAssigneeFromMacro(user, macro);

    if (newAssignee) {
      this.setAssignee(...newAssignee);
    }

    macro.get('addTags').forEach(name => {
      this.addTag(model, { name });
    });

    macro.get('removeTags').forEach(name => {
      this.removeTag(this.get('tagService').getTagByName(name));
    });

    macro.get('actions').forEach(action => {
      const actionName = action.get('name');
      if(actionName === 'subject') {
        this.setSubject(action.get('value'));
      } else if (actionName === 'brand') {
        const brandId = action.get('value');
        const brand = this.get('store').peekRecord('brand', brandId);
        if (brand) {
          if (model.get('isNew')) {
            model.set('brand', brand);
          } else {
            this.get('setBrand').perform(brand).then(() => model.get('replyChannels').reload());
          }
        }
      } else if (actionName === 'mailbox') {
        const mailboxId = action.get('value');
        const mailbox = this.get('store').peekAll('channel').find(channel => String(channel.get('account.id')) === String(mailboxId));
        if (mailbox) {
          this.setChannel(mailbox);
        }
      } else if (actionName === 'clear_tags') {
        this.clearTags();
      } else if (actionName === 'change_tags') {
        const tags = action.get('value').split(',').map(tag => tag.trim());
        this.setTags(model, tags);
      } else if (actionName.startsWith('customfield_')) {
        const customFieldId = actionName.split('_')[1];
        const caseField = this.get('store').peekRecord('case-field', customFieldId);
        if (caseField) {
          let value = action.get('value');
          if (caseField.get('fieldType') === 'YESNO') {
            value = value === 'true' ? 'yes' : 'no';
          } else if (caseField.get('fieldType') === 'CHECKBOX') {
            value = value.split(',').map(v => v.trim()).join(',');
          }
          this.setCustomField(caseField, value);
        }
      }
    });

    this.persistTabState();

    this.get('macro').trackUsage(macro.get('id'));
  },

  addTag(model, tag) {
    const tagName = get(tag, 'actualName') || get(tag, 'name');
    const editedTags = this.get('editedTags');
    if (editedTags.find(tag => tag.get('name') === tagName)) {
      return;
    }
    const newTag = EmberObject.create({
      name: tagName,
      isKREEdited: false,
      isNew: !model.get('tags').find(tag => tag.get('name') === tagName)
    });
    editedTags.pushObject(newTag);
    editedTags.forEach(tag => tag.set('isErrored', false));
    this.set('editedTags', editedTags);
    this.set('errorMap.tags', false);
    this.set('propertiesChangeViaKRE.tags', false);
    this.persistTabState();
  },

  removeTag(tag) {
    const tags = this.get('editedTags').rejectBy('name', tag.get('name'));
    tags.forEach(tag => tag.set('isErrored', false));
    this.set('editedTags', tags);
    this.set('errorMap.tags', false);
    this.set('propertiesChangeViaKRE.tags', false);
    this.persistTabState();
  },

  clearTags() {
    const editedTags = this.get('editedTags').reject(tag => tag.get('tagtype') !== 'SYSTEM');
    this.set('editedTags', editedTags);
    this.set('errorMap.tags', false);
    this.set('propertiesChangeViaKRE.tags', false);
    this.persistTabState();
  },

  setTags(model, tagNames) {
    const existingTags = this.get('editedTags');
    const systemTags = existingTags.filter(tag => tag.get('tagtype') === 'SYSTEM');
    const newTags = tagNames.map(name => EmberObject.create({ 
      name, 
      isKREEdited: false, 
      isNew: !model.get('tags').find(tag => tag.get('name') === name)
    }));
    const finalTags = [...systemTags, ...newTags];
    this.set('editedTags', finalTags);
    this.set('errorMap.tags', false);
    this.set('propertiesChangeViaKRE.tags', false);
    this.persistTabState();
  },

  setPostContent(newContent) {
    this.set('postContent', newContent);
    this.set('errorMap.contents', false);
    this.persistTabState();
  },

  appendPostContent(newContent) {
    const postContent = this.get('postContent');

    newContent = newContent.replace(/\n/g, '<br>');

    if (postContent.trim()) {
      this.setPostContent(postContent + '<br>' + newContent);
    } else {
      this.setPostContent(newContent);
    }
  },

  setSubject(subject) {
    this.set('subject', subject);
    this.set('editedCase.subject', subject);
    this.set('errorMap.subject', false);
    this.set('propertiesChangeViaKRE.subject', false);
    this.persistTabState();
  },

  setRequester(requester) {
    this.set('editedCase.requester', requester);
    this.set('errorMap.requester_id', false);
    this.set('propertiesChangeViaKRE.requester', false);
    this.persistTabState();
  },

  setAssignee(team, agent) {
    this.set('editedCase.assignedAgent', agent);
    this.set('editedCase.assignedTeam', team);
    this.set('errorMap.assigned_agent_id', false);
    this.set('errorMap.assigned_team_id', false);
    this.set('propertiesChangeViaKRE.assignee', false);
    this.persistTabState();
  },

  setStatus(status) {
    this.set('editedCase.status', status);
    this.set('errorMap.status_id', false);
    this.set('propertiesChangeViaKRE.status', false);

    this.persistTabState();
  },

  setType(type) {
    this.set('editedCase.caseType', type);
    this.set('errorMap.type_id', false);
    this.set('propertiesChangeViaKRE.caseType', false);
    this.persistTabState();
  },

  setPriority(priority) {
    this.set('editedCase.priority', priority);
    this.set('errorMap.priority_id', false);
    this.set('propertiesChangeViaKRE.priority', false);
    this.persistTabState();
  },

  setOrganization(organizationId) {
    this.set('editedCase.organization', organizationId);
    this.set('errorMap.organization_id', false);
    this.set('propertiesChangeViaKRE.organization', false);
    this.persistTabState();
  },

  setForm(form) {
    this.set('editedCase.form', form);
    this.set('errorMap.form_id', false);
    this.set('propertiesChangeViaKRE.form', false);
    this.persistTabState();
  },

  setTwitterType(type) {
    this.set('replyOptions.type', type);
    this.persistTabState();
  },

  setNoteDestination(destination) {
    this.set('noteDestination', destination);
    this.persistTabState();
  },

  assignToMe() {
    this.setAssignee(this.get('session.user.teams.firstObject'), this.get('session.user'));
  },

  assignToMeInTeam(team) {
    this.setAssignee(team, this.get('session.user'));
  },

  toggleCC(active) {
    this.set('isCCActive', active);
  },

  checkCCInput(text) {
    this.set('hasCCInput', Boolean(text.trim().length));
  },

  // Tasks
  trashCase: task(function * () {
    yield this.get('confirmation').confirm({
      intlConfirmationHeader: 'cases.confirm.trash_case_header',
      intlConfirmationBody: 'cases.confirm.trash_case',
      intlConfirmLabel: 'cases.confirm.trash_case_button'
    });
    yield this.get('performTrashCase').perform();
  }).drop(),

  performTrashCase: task(function * () {
    const caseModel = this.get('model');
    yield this.get('apiAdapter').trashCase(caseModel.get('id'));
    yield caseModel.reload();
    this.initEdits();
    this.persistTabState();
    this.get('tabStore').close(this.get('tab'));
    this.get('notification').success(this.get('i18n').t('cases.trash.success_message'));
  }).drop(),

  mergeCase: task(function * () {
    const caseModel = this.get('model');
    let timeline = this.get('timeline').timelineForCase(caseModel);
    yield this.get('mergeConversation').confirm({
      requesterName: caseModel.get('requester.fullName'),
      currentCase: caseModel,
      selectedConversations: []
    });

    yield timeline.get('fetchNewerAfterReply').perform();
  }).drop(),

  setBrand: task(function * (brand) {
    const caseModel = this.get('model');
    if (!caseModel || caseModel.get('isNew')) {
      return;
    }

    caseModel.set('brand', brand);
    let result = yield caseModel.save({ adapterOptions: { setBrand: true } });
    this.get('notification').success(this.get('i18n').t('cases.brand_changed', { brand: brand.get('name') }));
    return result;
  }).drop(),

  restoreCase: task(function * () {
    const caseModel = this.get('model');
    yield this.get('apiAdapter').restoreCase(caseModel.get('id'));
    yield caseModel.reload();
    this.get('notification').success(this.get('i18n').t('cases.trash.restore.success_message'));
  }).drop(),

  initChannels: task(function * () {
    if (this.get('model.isNew') && !this.get('editedCase.requester')) {
      return;
    }

    const channels = yield this.get('model.replyChannels');
    const replyChannel = this.selectSuitableReplyChannel(channels, this.get('publicChannelId'));

    if (replyChannel) {
      this.set('publicChannelId', replyChannel.get('id'));
    } else {
      this.set('publicChannelId', null);
      this.set('isNote', true);
    }

    if (!this.get('replyOptions.type')) {
      if (replyChannel && replyChannel.get('channelType') === 'TWITTER') {
        this.updateTwitterType('twitterTweet');
      } else {
        this.updateTwitterType(null);
      }
    }
  }).drop(),

  selectSuitableReplyChannel(channels, publicChannelId) {
    const existing = channels.findBy('id', publicChannelId);
    if (existing) {
      return existing;
    }

    const lastPublicChannel = channels.findBy('id', this.get('model.lastPublicChannel.id'));
    if (lastPublicChannel) {
      return lastPublicChannel;
    }

    const defaultChannel = channels.findBy('account.isDefault');
    if (defaultChannel) {
      return defaultChannel;
    }

    // otherwise fall-back to the first non-NOTE channel
    const nonNoteChannel = channels.findBy('account');
    if (nonNoteChannel) {
      return nonNoteChannel;
    }

    return null;
  },

  setCustomField(field, value) {
    if (value) {
      value = get(value, 'id') || value;
    }
    this.get('customFields').setValue(field, value);
    this.get('errorMap').set(field.get('key'), false);
    this.set('propertiesChangeViaKRE.customFields.' + field.get('id'), false);
    this.persistTabState();
  },

  create: task(function * () {
    if (this.isUploadInProgress()) {
      this.get('notification').add({
        type: 'warning',
        title: 'Upload in progress',
        autodismiss: true
      });
      return;
    }

    const model = this.get('model');
    const originalTags = model.get('tags').map(tag => tag);
    const uploads = this.get('attachedPostFiles').filter(attachment => isEmpty(attachment.get('error')));
    const attachmentIds = uploads.mapBy('attachmentId').compact();
    const replyOptions = this.get('replyOptions');
    const channel = this.get('channel');
    const post = formatPostForSending(this.get('postContent'), channel);

    model.set('tags', this.get('editedTags').map(tag => this.get('tagService').getTagByName(tag.get('name'))));

    model.set('contents', post);
    model.set('channel', channel.get('channelType'));
    model.set('channelId', channel.get('account.id'));
    model.set('attachmentFileIds', attachmentIds);
    model.set('channelOptions', this.get('store').createFragment('case-reply-options', replyOptions));

    try {
      yield this.get('virtualModel').save(model, this.get('editedCase'), caseSchema);
      yield this.get('refreshTags').perform(model);
      this.initEdits();
      this.persistTabState();

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('cases.case.created'),
        autodismiss: true
      });

      if (variation('release-apps')) {
        this.trigger('updated');
      }
    } catch (e) {
      if (e.errors[0].code === 'RATE_LIMIT_REACHED') {
        this.get('notification').add({
          type: 'error',
          title: this.get('i18n').t('cases.post-failed-rate-limit.label'),
          autodismiss: true
        });
      }
      model.get('errors').clear();
      model.set('tags', originalTags);
      this.set('errorMap', convertErrorsToMap(e.errors));

      throw e;
    }
  }).drop(),

  // we are just updating the case -- don't create a case-reply
  update: task(function * () {
    if (this.isUploadInProgress()) {
      this.get('notification').add({
        type: 'warning',
        title: 'Upload in progress',
        autodismiss: true
      });
      return;
    }

    const model = this.get('model');
    const editedCase = this.get('editedCase');
    const editedTags = this.get('editedTags');
    const originalTags = model.get('tags').toArray().slice(0);

    model.set('tags', editedTags.map(tag => this.get('tagService').getTagByName(tag.get('name'))));
    try {
      yield this.get('virtualModel').save(model, editedCase, caseSchema);
      yield this.get('refreshTags').perform(model);
      this.initEdits();
      this.applyRemoteChanges(model, editedCase, editedTags);
      this.persistTabState();

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('cases.case.updated'),
        autodismiss: true
      });

      if (variation('release-apps')) {
        this.trigger('updated');
      }
    } catch (e) {
      model.get('errors').clear();
      model.set('tags', originalTags);
      this.set('errorMap', convertErrorsToMap(e.errors));
      throw e;
    }
  }).drop(),

  updateAndResend: task(function * () {
    let propertyAttrs = this.gatherPropertyAttrs();
    let operations = this.get('timelineForModel.sendingOperations');

    operations.forEach(op => {
      let oldAttrs = get(op, 'attrs');
      let newAttrs = assign({}, oldAttrs, propertyAttrs);
      set(op, 'state', OP_STATE_WAITING);
      set(op, 'attrs', newAttrs);
    });

    this.get('deliveryLoop').perform();
  }),

  legacyReply: task(function * (timeline) {
    if (this.isUploadInProgress()) {
      this.get('notification').add({
        type: 'warning',
        title: 'Upload in progress',
        autodismiss: true
      });
      return;
    }

    const model = this.get('model');
    const originalTags = model.get('tags').map(tag => tag);
    const uploads = this.get('attachedPostFiles').filter(attachment => isEmpty(attachment.get('error')));
    const attachmentIds = uploads.mapBy('attachmentId').compact();
    const replyOptions = this.get('replyOptions');
    const inReplyToUuid = this.get('inReplyTo.uuid');
    const channel = this.get('channel');
    const post = formatPostForSending(this.get('postContent'), channel);
    const editedTags = this.get('editedTags');

    model.set('tags', editedTags.map(tag => this.get('tagService').getTagByName(tag.get('name'))));
    const editedCase = this.get('editedCase');

    const channelType = channel.get('channelType');
    const reply = this.get('store').createRecord('case-reply', {
      case: model,
      channel: channel.get('account'),
      assignedTeam: editedCase.get('assignedTeam'),
      assignedAgent: editedCase.get('assignedAgent'),
      channelType,
      contents: post,
      inReplyToUuid: inReplyToUuid,
      channelOptions: this.get('store').createFragment('case-reply-options', replyOptions),
      status: editedCase.get('status'),
      caseType: editedCase.get('caseType'),
      priority: editedCase.get('priority'),
      requester: editedCase.get('requester'),
      subject: editedCase.get('subject'),
      form: editedCase.get('form'),
      fieldValues: [],
      tags: editedTags.map(tag => tag.get('name')).join(','),
      attachmentFileIds: attachmentIds
    });

    editedCase.get('customFields').forEach((customField) => {
      reply.get('fieldValues').createFragment({
        fieldId: customField.get('field.id'),
        value: customField.get('value')
      });
    });

    try {
      const caseReply = yield reply.save();
      timeline.clearLocalReadState();
      timeline.addSentPosts(caseReply.get('posts'));
      yield this.get('refreshTags').perform(model);
      this.initEdits();
      this.applyRemoteChanges(model, editedCase, editedTags);
      this.persistTabState();

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('cases.case.updated'),
        autodismiss: true
      });

      if (variation('release-apps')) {
        this.trigger('updated');
      }
    } catch (e) {
      model.get('errors').clear();
      model.set('tags', originalTags);
      this.set('errorMap', convertErrorsToMap(e.errors));
      throw e;
    }
  }).drop(),

  hasReply() {
    const attachments = this.get('attachedPostFiles').filter(attachment => isEmpty(attachment.get('error')));
    const attachmentIds = attachments.mapBy('attachmentId').compact();
    return this.get('postContent').trim() !== '' || attachmentIds.length > 0;
  },

  isUploadInProgress() {
    // @TODO we need to do something better here, UI wise.
    const uploads = this.get('attachedPostFiles');
    return uploads.any(u => u.get('status') === 'PROGRESS');
  },

  updateCaseFromKRE(payload) {
    if (this.get('isSaving')) {
      return;
    }
    this.get('reloadCase').perform(payload);
  },

  reloadCase: task(function * ({ changed_properties }) {
    const caseModel = this.get('model');

    // if the case is still saving, bail out otherwise Ember Data triggers an error
    // this happens if we get a KRE event during an update
    if (caseModel.get('isReloading') || caseModel.get('isSaving')) {
      return;
    }

    const original = this.get('virtualModel').makeSnapshot(caseModel, caseSchema);
    const originalTags = caseModel.get('tags').toArray().slice(0);
    yield caseModel.reload();
    yield this.get('refreshTags').perform(caseModel);
    if (changed_properties.pinned_notes_count !== undefined) {
      yield this.get('refreshNotes').perform();
      // Pinned notes updates to not be notified about
      caseModel.setProperties({ lastUpdatedBy: null });
    }
    this.applyRemoteChanges(caseModel, original, originalTags);

    if (variation('release-apps')) {
      this.trigger('updated');
    }
  }).keepLatest(),

  applyRemoteChanges(caseModel, original, originalTags) {
    const propertiesChangeViaKRE = this.get('propertiesChangeViaKRE');
    const editedCase = this.get('editedCase');
    const errorMap = this.get('errorMap');

    if (original.get('assignedTeam') !== caseModel.get('assignedTeam.content') ||
      original.get('assignedAgent') !== caseModel.get('assignedAgent.content')) {
      editedCase.set('assignedTeam', caseModel.get('assignedTeam.content'));
      editedCase.set('assignedAgent', caseModel.get('assignedAgent.content'));
      errorMap.set('assigned_agent_id', false);
      errorMap.set('assigned_team_id', false);
      propertiesChangeViaKRE.set('assignee', true);
    }

    if (original.get('subject') !== caseModel.get('subject')) {
      editedCase.set('subject', caseModel.get('subject'));
      errorMap.set('subject', false);
      propertiesChangeViaKRE.set('subject', true);
    }

    const asyncProperties = ['requester', 'status', 'caseType', 'priority', 'form'];
    asyncProperties.forEach(property => {
      if (original.get(property) !== caseModel.get(property + '.content')) {
        editedCase.set(property, caseModel.get(property + '.content'));
        errorMap.set(property, false);
        propertiesChangeViaKRE.set(property, true);
      }
    });

    this.appendToUpdateLog(caseModel.get('lastUpdatedBy.content'), caseModel.get('updatedAt'));

    this.get('store').peekAll('case-field').forEach(field => {
      let fieldPredicate = fieldValue => fieldValue.get('field.id') === field.get('id');
      let originalField = original.get('customFields').find(fieldPredicate);
      let updatedField = caseModel.get('customFields').find(fieldPredicate);
      let userModifiedField = editedCase.get('customFields').find(fieldPredicate);

      let originalValue = originalField ? originalField.get('value') : undefined; // eslint-disable-line no-undefined
      let updatedValue = updatedField ? updatedField.get('value') : undefined; // eslint-disable-line no-undefined
      let userModifiedValue = userModifiedField ? userModifiedField.get('value') : undefined; // eslint-disable-line no-undefined

      if (originalValue !== updatedValue) {
        // if the missing value was replaced with an empty string or vice versa, we won't mark it
        // as changed via kre (given that the local value was also falsish)
        const isFalsish = val => val === undefined || val === ''; // eslint-disable-line no-undefined
        const sameish = _.every([userModifiedValue, originalValue, updatedValue], isFalsish);
        if (!sameish) {
          propertiesChangeViaKRE.get('customFields').set(field.get('id'), true);
        }
        errorMap.set(field.get('key'), false);
        if (updatedField) {
          if (userModifiedField) {
            userModifiedField.set('value', updatedValue);
          } else {
            const value = updatedField.get('value');
            const newField = EmberObject.create({ field, value });
            editedCase.get('customFields').pushObject(newField);
          }
        } else {
          editedCase.get('customFields').removeObject(userModifiedField);
        }
      }
    });

    const editedTags = this.get('editedTags');

    const serverTagNames = caseModel.get('tags').map(tag => tag.get('name'));
    const originalTagNames = originalTags.map(tag => tag.get('name'));
    const tagsWereModified = serverTagNames.length !== originalTagNames.length || _.difference(serverTagNames, originalTagNames).length > 0;

    if (tagsWereModified) {
      errorMap.set('tags', false);
      propertiesChangeViaKRE.set('tags', true);
    }

    // Tags aded by the server
    serverTagNames.forEach(tagName => {
      if (originalTagNames.indexOf(tagName) === -1) {
        let tag = editedTags.find(tag => tag.get('name') === tagName);
        if (!tag) {
          tag = EmberObject.create({
            name: tagName
          });
          editedTags.pushObject(tag);
        }
        tag.set('isKREEdited', true);
        tag.set('isNew', false);
      }
    });

    // Tags removed by the server
    originalTagNames.forEach(tagName => {
      if (serverTagNames.indexOf(tagName) === -1) {
        const tag = editedTags.find(tag => tag.get('name') === tagName);
        if (tag) {
          editedTags.removeObject(tag);
        }
      }
    });
    this.persistTabState();
  },

  enqueueReply: task(function * (meta) {
    if (this.isUploadInProgress()) {
      this.get('notification').add({
        type: 'warning',
        title: 'Upload in progress',
        autodismiss: true
      });
      return;
    }

    let timelineService = this.get('timeline');
    let model = this.get('model');
    let timeline = timelineService.timelineForCase(model);

    let code = this.get('arePropertiesEdited') ? 'replyAndUpdate' : 'reply';
    let attrs = this.gatherAttrsForOperation();
    let state = OP_STATE_WAITING;
    let createdAt = this.get('serverClock').getServerTime().toDate();
    let op = { code, attrs, state, meta, createdAt };

    this.resetReplyBox();
    timeline.addSendingOperation(op);
    this.get('deliveryLoop').perform();
  }),

  resend(operation) {
    set(operation, 'state', OP_STATE_WAITING);
    this.get('deliveryLoop').perform();
  },

  deliveryLoop: task(function * () {
    let timelineService = this.get('timeline');
    let model = this.get('model');
    let timeline = timelineService.timelineForCase(model);

    while (true) {
      // Get first op in outbox
      let op = timeline.get('sendingOperations.firstObject');

      // Guard no op
      if (!op) {
        return;
      }

      let state = get(op, 'state');

      if (state !== OP_STATE_WAITING) {
        return;
      }

      set(op, 'state', OP_STATE_SENDING);

      let attrs = get(op, 'attrs');
      let code = get(op, 'code');
      let task;

      switch(code) {
        case 'reply': {
          task = this.get('reply');
          break;
        }

        case 'replyAndUpdate': {
          task = this.get('replyAndUpdate');
          break;
        }

        default:
          throw new Error(`Unknown op code: ${code}`);
      }

      if (variation('ops-simulate-flaky-sends')) {
        yield timeout(5000);

        if (Math.random() > 0.75) {
          set(op, 'state', OP_STATE_FAILED);
          continue;
        }
      }

      try {
        yield task.perform(attrs);
        timeline.get('sendingOperations').shiftObject();
      } catch (error) {
        console.error(error); /* eslint no-console: "off" */
        set(op, 'error', error);
        set(op, 'state', OP_STATE_FAILED);
        timeline.notifySendingOperationUpdate(op);
        return;
      }
    }
  }).drop(),

  reply: task(function * (attrs) {
    let store = this.get('store');
    let model = this.get('model');
    let originalTags = model.get('tags').map(tag => tag);
    attrs = assign({}, attrs, {
      channelOptions: store.createFragment('case-reply-options', attrs.channelOptions),
      fieldValues: attrs.fieldValues.map(fieldValue => store.createFragment('case-field-value', fieldValue))
    });
    let reply = store.createRecord('case-reply', attrs);
    let timeline = this.get('timeline').timelineForCase(attrs.case);

    try {
      yield reply.save();
      timeline.addSentPosts(reply.get('posts'));
      yield this.get('refreshTags').perform(this.get('model'));
      yield this.setParticipantsAsCCs();
      this.applyRemoteChanges(attrs.case, this.get('editedCase'), this.get('editedTags'));
      this.resetSidebar();
      timeline.get('fetchNewerAfterReply').perform();
      if (variation('release-apps')) {
        this.trigger('updated');
      }
    } catch (error) {
      reply.deleteRecord();
      model.get('errors').clear();
      model.set('tags', originalTags);
      this.set('errorMap', convertErrorsToMap(error.errors));
      throw error;
    }
  }),

  replyAndUpdate: task(function * (attrs) {
    yield this.get('reply').perform(attrs);
  }),

  gatherAttrsForOperation() {
    let messageAttrs = this.gatherMessageAttrs();
    let propertyAttrs = this.gatherPropertyAttrs();
    let result = assign({}, messageAttrs, propertyAttrs);

    return result;
  },

  gatherMessageAttrs() {
    let model = this.get('model');
    let channel = this.get('channel');
    let channelType = channel.get('channelType');
    let channelOptions = cloneDeep(this.get('replyOptions'));
    let contents = formatPostForSending(this.get('postContent'), channel);
    let uploads = this.get('attachedPostFiles').filter(attachment => isEmpty(attachment.get('error')));
    let attachmentFileIds = uploads.mapBy('attachmentId').compact();
    let inReplyToUuid = this.get('inReplyTo.uuid');
    let clientId = uuid();

    if (this.get('atMentionsSupported')) {
      let mentions = extractMentions(contents);

      if (mentions.length) {
        let mentionsPayload = this._convertToMentionsPayload(mentions);
        mentionsPayload = this._dedupeMentionsPayload(mentionsPayload);
        channelOptions.set('mentions', mentionsPayload);
      }
    } else {
      contents = replaceMentionsWithPlainText(contents);
    }

    return {
      clientId,
      case: model,
      channel: channel.get('account'),
      channelType,
      channelOptions,
      inReplyToUuid,
      contents,
      attachmentFileIds,
      attachments: uploads
    };
  },

  _convertToMentionsPayload(mentions) {
    return mentions.map(({ subjectId, type }) => {
      return { id: subjectId, type };
    });
  },

  _dedupeMentionsPayload(mentions) {
    const serializeAndDedupe = (m, { id, type }) => {
      let key = `${id}|${type}`;

      if (!m.includes(key)) {
        m.push(key);
      }

      return m;
    };

    const deserialize = (item) => {
      let [id, type] = item.split('|');
      return { id, type };
    };

    return mentions.reduce(serializeAndDedupe, []).map(deserialize);
  },

  gatherPropertyAttrs() {
    let editedCase = this.get('editedCase');
    let editedTags = this.get('editedTags');
    let fieldValues = editedCase.get('customFields').map(field => ({
      fieldId: field.get('field.id'),
      value: field.get('value')
    }));
    let tags = editedTags.mapBy('name').join(',');

    return {
      assignedTeam: editedCase.get('assignedTeam'),
      assignedAgent: editedCase.get('assignedAgent'),
      status: editedCase.get('status'),
      caseType: editedCase.get('caseType'),
      priority: editedCase.get('priority'),
      requester: editedCase.get('requester'),
      subject: editedCase.get('subject'),
      form: editedCase.get('form'),
      organization: editedCase.get('organization'),
      fieldValues,
      tags
    };
  },

  inferStateFromLatestPosts(posts) {
    this._inferTwitterStateFromLatestPosts(posts);
  },

  _inferTwitterStateFromLatestPosts(posts) {
    if (!variation('release-infer-twitter-reply-type')) {
      return;
    }

    let latestMessage = [...posts].reverse().findBy('original.isMessage');

    if (!latestMessage) {
      return;
    }


    let postType = latestMessage.get('original.postType');
    let channelType = this.get('channel.channelType');

    if (!postType) {
      return;
    }

    if (!postType.startsWith('twitter')) {
      return;
    }

    if (channelType !== 'TWITTER') {
      return;
    }

    this.updateTwitterType(postType);
  }
});
