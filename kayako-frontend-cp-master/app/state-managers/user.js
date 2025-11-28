import { or } from '@ember/object/computed';
import EmberObject, {
  observer,
  computed,
  get
} from '@ember/object';
import { isEmpty } from '@ember/utils';
import _ from 'npm:lodash';
import { scheduleOnce } from '@ember/runloop';
import EditedCustomFields from 'frontend-cp/lib/edited-custom-fields';
import { task } from 'ember-concurrency';
import { attr, fragment, many, model } from 'frontend-cp/services/virtual-model';
import { jsonToObject } from 'frontend-cp/utils/object';
import convertErrorsToMap from 'frontend-cp/lib/convert-errors-to-map';
import { assign } from '@ember/polyfills';
import { inject as service } from '@ember/service';
import UploadFile from 'frontend-cp/lib/upload-file';
import Evented from '@ember/object/evented';
import { variation } from 'ember-launch-darkly';

const userSchema = model('user', {
  isEnabled: attr(),
  role: attr(),
  timeZone: attr(),
  locale: attr(),
  fullName: attr(),
  signature: attr({ nonStrictMatching: true }),
  agentCaseAccess: attr(),
  organizationCaseAccess: attr(),
  customFields: many(fragment('user-field-value', {
    field: attr(),
    value: attr()
  }))
});

const cleanupAttachments = (attachments) => {
  attachments.removeObjects(attachments.filter(attachment => !isEmpty(attachment.get('error'))));
  return attachments;
};

export default EmberObject.extend(Evented, {
  user: null,
  replyContent: '',
  editedTags: null,
  editedTeams: null,
  editedUser: null,
  errorMap: null,
  customFields: null,
  posts: null,
  bottomPostsAvailable: false,
  topPostsAvailable: true,
  loadingTop: false,
  loadingBottom: false,
  recentFeedback: [],
  isSaving: false,
  tab: null,
  attachedPostFiles: null,
  noteDestination: null,

  // Services - initialized outside
  i18n: service(),
  confirmation: service(),
  metrics: service(),
  notification: service(),
  permissions: service(),
  store: service(),
  tabStore: service(),
  tagsService: service('tags'),
  virtualModel: service(),
  agentCache: service('cache/agent-cache'),

  init() {
    this._super(...arguments);
    this.resetEdits();
    const savedState = jsonToObject(this.get('tab').state.user);

    // attachments should be re-created as correct UploadFile objects
    if (savedState.attachedPostFiles) {
      savedState.attachedPostFiles = savedState.attachedPostFiles.map(attachment =>
        UploadFile.create(attachment)
      );
    }

    this.setProperties(savedState);
    this.persistTabState();
  },

  // CP
  isBeingDeleted: computed('deleteUser.isRunning', 'user.isDeleted', function () {
    return this.get('deleteUser.isRunning') || this.get('user.isDeleted');
  }),

  hasUpdateUserPermission: computed(function() {
    return this.get('permissions').has('users.update');
  }),

  isAccessLevelEdited: computed('user.{agentCaseAccess,organizationCaseAccess}',
    'editedUser.{agentCaseAccess,organizationCaseAccess}', 'isBeingDeleted', function () {
      if (this.get('isBeingDeleted')) {
        return false;
      }

      return (this.get('user.agentCaseAccess') !== this.get('editedUser.agentCaseAccess') ||
        this.get('user.organizationCaseAccess') !== this.get('editedUser.organizationCaseAccess'));
    }),

  isContentEdited: computed('replyContent', 'isBeingDeleted', function() {
    if (this.get('isBeingDeleted')) {
      return false;
    }

    return this.get('replyContent').trim() !== '';
  }),

  isRoleEdited: computed('user.role', 'editedUser.role', 'isBeingDeleted', function () {
    if (this.get('isBeingDeleted')) {
      return false;
    }

    return (this.get('user.role') !== this.get('editedUser.role'));
  }),

  isTagsFieldEdited: computed('editedTags.@each.name', 'user.tags.@each.name', 'isBeingDeleted', function() {
    if (this.get('isBeingDeleted')) {
      return false;
    }

    let editedTags = this.get('editedTags').mapBy('name');
    let tags = this.get('user.tags').mapBy('name');
    return (editedTags.length !== tags.length || _.intersection(editedTags, tags).length !== tags.length);
  }),

  isTimezoneEdited: computed('user.timeZone', 'editedUser.timeZone', 'isBeingDeleted', function () {
    if (this.get('isBeingDeleted')) {
      return false;
    }

    return this.get('user.timeZone') !== this.get('editedUser.timeZone');
  }),

  isLocaleEdited: computed('user.locale.id', 'editedUser.locale.id', 'isBeingDeleted', function () {
    if (this.get('isBeingDeleted')) {
      return false;
    }

    return this.get('user.locale.id') !== this.get('editedUser.locale.id');
  }),

  isTeamsFieldEdited: computed('editedTeams.@each.id', 'user.teams.@each.id', 'isBeingDeleted', function() {
    if (this.get('isBeingDeleted')) {
      return false;
    }

    let editedTeams = this.get('editedTeams').mapBy('id');
    let teams = this.get('user.teams').mapBy('id');
    return (editedTeams.length !== teams.length || _.intersection(editedTeams, teams).length !== teams.length);
  }),

  isSignatureEdited: computed('user.signature', 'editedUser.signature', 'isBeingDeleted', function () {
    if (this.get('isBeingDeleted')) {
      return false;
    }

    return (this.get('user.signature') !== this.get('editedUser.signature') && (this.get('user.signature') || this.get('editedUser.signature')));
  }),

  arePropertiesEdited: or('customFields.isEdited', 'isTagsFieldEdited',
    'isTimezoneEdited', 'isRoleEdited',
    'isAccessLevelEdited', 'isTeamsFieldEdited', 'isLocaleEdited'),

  isEdited: or('isContentEdited', 'arePropertiesEdited'),

  // We have to set this magic property, because after
  // save/restore stte operation, computed property will
  // stop updating.
  isEditedChanged: observer('isEdited', function() {
    scheduleOnce('sync', this, 'persistTabState');
  }),

  // Methods
  resetEdits() {
    this.resetSidebar();
    this.setProperties({
      attachedPostFiles: [],
      replyContent: '',
      noteDestination: null
    });
  },

  resetSidebar() {
    const user = this.get('user');
    const editedUser = this.get('virtualModel').makeSnapshot(user, userSchema);

    this.setProperties({
      errorMap: EmberObject.create(),
      editedUser,
      customFields: EditedCustomFields.create({
        originalCustomFields: get(user, 'customFields'),
        editedCustomFields: get(editedUser, 'customFields')
      }),
      editedTeams: get(user, 'teams').map(team => ({
        id: team.get('id'),
        title: team.get('title')
      })),
      editedTags: get(user, 'tags').map(tag => {
        return EmberObject.create({name: tag.get('name'), isKREEdited: false, isNew: false});
      })
    });
  },

  persistTabState() {
    this.get('tabStore').updateState(this.get('tab'), {
      user: assign(this.getProperties(
        'replyContent',
        'attachedPostFiles',
        'noteDestination'
      ), {
        _isEdited: this.get('isEdited')
      })
    });
  },

  resetPosts(postId) {
    this.setProperties({
      posts: [],
      topPostsAvailable: true,
      bottomPostsAvailable: Boolean(postId)
    });
  },

  updatePostContent(newContent) {
    this.set('replyContent', newContent);
    this.persistTabState();
  },

  setRole(role) {
    this.set('editedUser.role', role);
    this.set('errorMap.role_id', null);
  },

  setCustomField(field, value) {
    if (value) {
      value = get(value, 'id') || value;
    }
    this.get('errorMap').set(field.get('key'), false);
    this.get('customFields').setValue(field, value);
  },

  setSignature(signature) {
    this.set('editedUser.signature', signature);
  },

  setOrganization(org) {
    this.set('editedUser.organization', org);
    this.set('errorMap.organization_id', null);
  },

  setName(name) {
    this.set('editedUser.fullName', name);
  },

  setAgentAccessLevel(level) {
    this.set('editedUser.agentCaseAccess', level);
    this.set('editedUser.organizationCaseAccess', null);
    this.set('errorMap.agent_case_access', null);
  },

  setOrganizationAccessLevel(level) {
    this.set('editedUser.organizationCaseAccess', level);
    this.set('editedUser.agentCaseAccess', null);
    this.set('errorMap.organization_case_access', null);
  },

  setTimezone(timezone) {
    this.set('editedUser.timeZone', timezone);
    this.set('errorMap.time_zone', null);
  },

  setLocale(locale) {
    this.set('editedUser.locale', locale);
    this.set('errorMap.locale', null);
  },

  addTeam(team) {
    if (!team.id) {
      return;
    }

    this.get('editedTeams').pushObject({
      id: team.get('id'),
      title: team.get('title'),
      isNew: !this.get('user.teams').find(t => t.get('id') === team.get('id'))
    });
    this.set('errorMap.team_ids', null);
  },

  removeTeam(team) {
    this.get('editedTeams').removeObject(team);
    this.set('errorMap.team_ids', null);
  },

  addTag({ name, actualName }) {
    this.get('editedTags').pushObject({
      name: actualName || name,
      isNew: !this.get('user.tags').find(tag => tag.get('name') === (actualName || name))
    });
    this.set('errorMap.tags', null);
  },

  removeTag(tag) {
    this.get('editedTags').removeObject(tag);
    this.set('errorMap.tags', null);
  },

  addAttachment(attachment) {
    const attachments = cleanupAttachments(this.get('attachedPostFiles'));

    attachments.pushObject(attachment);
    this.set('attachedPostFiles', attachments);
    this.persistTabState();
  },

  cancelAttachment(attachment) {
    const attachments = cleanupAttachments(this.get('attachedPostFiles'));

    attachments.removeObjects(attachments.filter((a) => a === attachment));

    this.set('attachedPostFiles', attachments);
    this.persistTabState();
  },

  updateAttachments() {
    this.persistTabState();
  },

  isUploadInProgress() {
    const uploads = this.get('attachedPostFiles');
    return uploads.any(u => u.get('status') === 'PROGRESS');
  },

  setNoteDestination(destination) {
    this.set('noteDestination', destination);
    this.persistTabState();
  },

  toggleUserState: task(function *() {
    const previousState = this.get('editedUser.isEnabled');

    this.set('editedUser.isEnabled', !previousState);

    try {
      yield this.get('save').perform('toggleUserState');
    } catch (e) {
      this.set('editedUser.isEnabled', previousState);

      throw e;
    }

    if (this.get('user.role.isCollaboratorOrHigher')) {
      this.get('agentCache').invalidateCache();
    }
  }),

  confirmRoleChange: task(function *() {
    let CUSTOMER = 'CUSTOMER';
    let oldRoleType = this.get('user.role.roleType');
    let newRoleType = this.get('editedUser.role.roleType');

    if (oldRoleType === CUSTOMER && newRoleType !== CUSTOMER) {
      yield this.get('confirmation').confirm({
        intlConfirmLabel: 'users.change_role.from_customer_confirm_button',
        intlConfirmationBody: 'users.change_role.from_customer',
        intlConfirmationHeader: 'users.change_role.from_customer_header'
      });
    }

    if (oldRoleType !== CUSTOMER && newRoleType === CUSTOMER) {
      yield this.get('confirmation').confirm({
        intlConfirmLabel: 'users.change_role.to_customer_confirm_button',
        intlConfirmationBody: 'users.change_role.to_customer',
        intlConfirmationHeader: 'users.change_role.to_customer_header'
      });
    }
  }).drop(),

  submit: task(function * () {
    yield this.get('confirmRoleChange').perform();
    const task = this.get('isContentEdited') ? 'saveEverything' : 'updateProperties';
    yield this.get(task).perform();
    this.get('notification').add({
      type: 'success',
      title: this.get('i18n').t('users.user.updated'),
      autodismiss: true
    });
    this.resetEdits();
    this.persistTabState();
  }).drop(),

  updateProperties: task(function * () {
    yield this.get('save').perform();
  }).drop(),

  saveEverything: task(function * () {
    yield this.get('save').perform();
    yield this.get('postNote').perform();
  }).drop(),

  postNote: task(function * () {
    if (this.isUploadInProgress()) {
      this.get('notification').add({
        type: 'warning',
        title: 'Upload in progress',
        autodismiss: true
      });
      return;
    }

    const uploads = this.get('attachedPostFiles').filter(attachment => isEmpty(attachment.get('error')));
    const attachmentIds = uploads.mapBy('attachmentId').compact();

    const contents = this.get('replyContent').trim();
    yield this.get('store').createRecord('user-note', {
      contents,
      user: this.get('user'),
      attachmentFileIds: attachmentIds
    }).save();
  }),

  save: task(function * (callee) {
    if (!this.get('hasUpdateUserPermission')) {
      return;
    }

    const user = this.get('user');
    const originalTags = user.get('tags').map(tag => tag);
    const originalTeams = user.get('teams').map(team => team);
    const tagsService = this.get('tagsService');
    const tags = this.get('editedTags').map(tag => tagsService.getTagByName(get(tag, 'name')));
    const teams = this.get('editedTeams').map(team =>
      this.get('store').peekRecord('team', get(team, 'id'))
    );

    user.setProperties({ tags, teams });

    const changeAffectsAgentList = this.shouldBreakAgentCache(user, this.get('editedUser'));

    try {
      let options = {
        adapterOptions: {}
      };
      if (callee === 'toggleUserState') {
        options.adapterOptions.toggleUser = true;
      }
      yield this.get('virtualModel').save(user, this.get('editedUser'), userSchema, options);
      yield user.get('tags').reload();
      user.set('tags', user.get('tags').filterBy('isNew', false));

      if (changeAffectsAgentList) {
        this.get('agentCache').invalidateCache();
      }

      this.persistTabState();
      if (variation('release-apps')) {
        this.trigger('updated');
      }
    } catch (e) {
      this.set('errorMap', convertErrorsToMap(e.errors));
      user.setProperties({
        tags: originalTags,
        teams: originalTeams
      });
      throw e;
    }
  }).drop(),

  deleteUser: task(function * () {
    yield this.get('user').destroyRecord();
  }).drop(),

  shouldBreakAgentCache(originalUser, newUser) {
    if (originalUser.get('role.isCollaboratorOrHigher') !== newUser.get('role.isCollaboratorOrHigher')) {
      return true;
    }
  }
});
