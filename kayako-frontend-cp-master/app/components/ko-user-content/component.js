import { scheduleOnce } from '@ember/runloop';
import Ember from 'ember';
import Component from '@ember/component';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import { task, timeout, didCancel } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import EmberObject from '@ember/object';
import { computed, get } from '@ember/object';
import { readOnly, alias, notEmpty, or } from '@ember/object/computed';
import { getOwner } from '@ember/application';
import { run, debounce } from '@ember/runloop';
import jQuery from 'jquery';
import _ from 'npm:lodash';
import moment from 'moment';
import { capitalize } from '@ember/string';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import {
  validateTwitterHandleFormat as isTwitterHandle
} from 'frontend-cp/utils/format-validations';
import diffAttrs from 'ember-diff-attrs';
import styles from './styles';
import { EDITOR_SELECTOR } from 'frontend-cp/components/ko-text-editor/component';
import { getMetaData } from 'frontend-cp/utils/bugsnag';
import { variation } from 'ember-launch-darkly';

const CUSTOMER_ROLE_ID = 4;
const FOCUS_DEBOUNCE_TIME = 400;

export default Component.extend(KeyboardShortcuts, {
  // HTML
  localClassNames: ['root'],

  // Attributes
  user: null,
  case: null,
  tabId: null,
  tabsComponent: null,
  instantEntityTerm: '',
  instantEntityResults: null,
  redirectingToUser: false,
  username: '',
  setOrganizationMode: false,
  unsetOrgInProgress: false,
  removedOrg: null,
  timestamp: null,

  onCreateNewCase: null,
  onTabNameUpdate: null,

  // State
  editingSignature: null,
  roles: [],
  appAccessModal: false,
  signatureModal: false,
  disableTwoFactorModal: false,
  deleteUserModal: false,
  remove2FAButtonDisabled: false,
  teamRecords: [],
  state: null,
  grants: [],

  // Services
  store: service(),
  permissionService: service('permissions'),
  notification: service('notification'),
  errorHandler: service('error-handler'),
  customFieldsList: service('custom-fields/list'),
  i18n: service(),
  confirmation: service(),
  routing: service('-routing'),
  session: service(),
  uploadService: service('fileUpload'),
  tabStore: service(),
  metrics: service(),

  // State attributes
  errorMap: readOnly('state.errorMap'),
  editedTags: readOnly('state.editedTags'),
  editedTeams: readOnly('state.editedTeams'),
  editedUser: alias('state.editedUser'),
  fullName: readOnly('state.editedUser.fullName'),
  hasUpdateUserPermission: readOnly('state.hasUpdateUserPermission'),
  organization: readOnly('state.editedUser.organization'),
  role: readOnly('state.editedUser.role'),
  signature: readOnly('state.editedUser.signature'),
  timeZone: readOnly('state.editedUser.timeZone'),
  locale: readOnly('state.editedUser.locale'),
  agentCaseAccess: readOnly('state.editedUser.agentCaseAccess'),
  organizationCaseAccess: readOnly('state.editedUser.organizationCaseAccess'),
  attachedPostFiles: readOnly('state.attachedPostFiles'),
  uploadingFiles: readOnly('uploadService.uploadFile.isRunning'),
  selectedNoteDestination: readOnly('state.noteDestination'),

  keyboardShortcuts: {
    'ctrl+alt+n': {
      action: 'focusEditor',
      global: false,
      preventDefault: true
    },
    n: {
      action: 'focusEditor',
      global: false
    },
    'mod+enter': {
      action: 'submit',
      global: true,
      preventDefault: true
    }
  },

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    this.initRoles();
    this.initTeams();
    this.get('initGrants').perform();
  },

  didReceiveAttrs: diffAttrs('user', function(changedAttrs, ...args) {
    this._super(...args);

    if (!changedAttrs || changedAttrs.user) {
      this.setProperties({
        editingSignature: null,
        appAccessModal: false,
        signatureModal: false,
        deleteUserModal: false
      });
      this.initRecentFeedback();
    }
  }),

  // CPs
  tabsModel: computed.or('case', 'user'),

  noteDestinations: computed('hasOrg', function() {
    const i18n = this.get('i18n');
    let options = [
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
  hasOrg: computed.bool('user.organization.name', 'removedOrg'),

  isMe: computed('session.user.id', 'user.id', function () {
    return this.get('session.user.id') === this.get('user.id');
  }),

  hasUser: computed('editedUser.fullName', function () {
    let username = this.get('editedUser.fullName') || this.get('user.fullName');

    return typeof username === 'string';
  }),

  isSaving: computed.or(
    'state.save.isRunning',
    'state.postNote.isRunning',
    'updateName.isRunning',
    'addExternalNote.isRunning',
    'unsetOrgInProgress'
  ),

  stateIsUnmodified: computed.not('state.isEdited'),
  submitDisabled: computed.or('isSaving', 'stateIsUnmodified', 'uploadingFiles'),

  agentAccessLevels: computed(function() {
    return [
      EmberObject.create({
        name: this.get('i18n').t('users.infobar.agentaccess.inherit'),
        value: 'INHERIT-FROM-ROLE'
      }),
      EmberObject.create({
        name: this.get('i18n').t('users.infobar.agentaccess.self'),
        value: 'SELF'
      }),
      EmberObject.create({
        name: this.get('i18n').t('users.infobar.agentaccess.teams'),
        value: 'TEAMS'
      }),
      EmberObject.create({
        name: this.get('i18n').t('users.infobar.agentaccess.all'),
        value: 'ALL'
      })
    ];
  }),

  organizationAccessLevels: computed(function() {
    return [
      EmberObject.create({
        name: this.get('i18n').t('users.infobar.organizationaccess.organization'),
        value: 'ORGANIZATION'
      }),
      EmberObject.create({
        name: this.get('i18n').t('users.infobar.organizationaccess.requested'),
        value: 'REQUESTED'
      })
    ];
  }),

  customFields: computed('user.customFields', function() {
    return this.get('user.customFields')
      .map(field => field.get('field'))
      .sortBy('sortOrder');
  }),

  availableTeams: computed('teamRecords.@each.id', 'editedTeams.@each.id', function () {
    const editedTeamIds = this.get('editedTeams').mapBy('id');

    return this.get('teamRecords').filter(team => editedTeamIds.indexOf(team.get('id')) === -1);
  }),

  canUpdateUser: computed('hasUpdateUserPermission', 'isSaving', function() {
    return this.get('hasUpdateUserPermission') && !this.get('isSaving');
  }),

  canAddNewIdentity: computed('canUpdateUser', 'user.isNew', function() {
    return this.get('canUpdateUser') && !this.get('user.isNew');
  }),

  canModifyUserState: computed('canUpdateUser', 'user.role', function() {
    return this.get('canUpdateUser') && this.get('permissionService').has('app.user.disable', this.get('user'));
  }),

  canFollowUser: computed('canUpdateUser', 'user.role', function() {
    return this.get('canUpdateUser') && this.get('permissionService').has('app.user.follow', this.get('user'));
  }),

  canChangeAgentAccessPermission: computed('hasUpdateUserPermission', 'role', function() {
    return this.get('hasUpdateUserPermission') && this.get('permissionService').has('app.user.change_agent_access_permission', this.get('state.editedUser'));
  }),

  canChangeOrganizationAccessPermission: computed('hasUpdateUserPermission', 'role', function() {
    return this.get('hasUpdateUserPermission') && this.get('permissionService').has('app.user.change_organization_access_permission', this.get('state.editedUser'));
  }),

  canChangeUserTeamPermission: computed('canUpdateUser', 'role', function() {
    return this.get('canUpdateUser') && this.get('permissionService').has('app.user.change_team_permission', this.get('state.editedUser'));
  }),

  canViewUserTeamPermission: computed('hasUpdateUserPermission', 'role', function() {
    return this.get('hasUpdateUserPermission') && this.get('permissionService').has('app.user.view_team_permission', this.get('state.editedUser'));
  }),

  canChangeRolePermission: computed('canUpdateUser', 'user.role', function() {
    return this.get('canUpdateUser') && this.get('permissionService').has('app.user.change_role_permission', this.get('user'));
  }),

  canPostUserNote: computed('role', function() {
    return this.get('permissionService').has('app.user.post_private_note', this.get('user'));
  }),

  showManageAppAccess: notEmpty('grants'),

  // Methods
  suggestTags: task(function * (searchTerm) {
    yield timeout(300);
    const addNewMessage = this.get('i18n').t('generic.addtagname', { tag: searchTerm });
    const data = yield this.get('store').query('tag', { name: searchTerm });
    const exactMatch = !!data.toArray().findBy('name', searchTerm) || !!this.get('editedTags').findBy('name', searchTerm);

    return _.difference(data.mapBy('name'), this.get('editedTags').mapBy('name'))
      .map(name => ({ name }))
      .concat(exactMatch ? [] : [{ name: addNewMessage, actualName: searchTerm }]);
  }).restartable(),

  setCaseAccessLevelDefaults(oldRoleType, newRoleType) {
    const state = this.get('state');
    const originalAgentAccessLevel = state.get('user.agentCaseAccess');
    const originalOrganizationAccessLevel = state.get('user.organizationCaseAccess');
    const requestedCaseAccessLevel = 'REQUESTED';
    const inheritedFromRoleAccessLevel = 'INHERIT-FROM-ROLE';

    if (oldRoleType !== 'CUSTOMER' && newRoleType === 'CUSTOMER') {
      if (originalOrganizationAccessLevel) {
        state.setOrganizationAccessLevel(originalOrganizationAccessLevel);
      } else {
        state.setOrganizationAccessLevel(requestedCaseAccessLevel);
      }
    } else if (oldRoleType === 'CUSTOMER' && newRoleType !== 'CUSTOMER') {
      // if user swaps from agent -> customer -> agent, we shouldn't lose the original access level
      if (originalAgentAccessLevel) {
        state.setAgentAccessLevel(originalAgentAccessLevel);
      } else {
        state.setAgentAccessLevel(inheritedFromRoleAccessLevel);
      }
    }
  },

  submit: task(function * () {
    if (this.get('submitDisabled')) {
      return;
    }
    const { state } = this.getProperties('state');
    const isRoleEdited = state.get('isRoleEdited');
    try {
      yield state.get('submit').perform();
      let note = yield this.get('timeline.fetchNewerAfterReply').perform(this.get('filter'));
      note = note.filterBy('note.id').get('firstObject.note.content');
      this.addNoteToViewNotesIfInNotesMode(note);
      if (variation('release-event-tracking') && isRoleEdited) {
        const teams = this.get('user.role.roleType') === 'CUSTOMER'? null: this.get('user.teams').getEach('id').join(',');
        this.get('metrics').trackEvent({
          event: 'user_role_edited',
          object: this.get('user.id'),
          new_role: this.get('user.role.roleType'),
          teams: teams
        });
      }
    } catch (e) {
      if (e.message !== 'The adapter rejected the commit because it was invalid') {
        throw e;
      }
    }
  }).drop(),

  searchOrganization: task(function * (query) {
    if (!query) {
      return [];
    }
    yield timeout(300);

    const adapter = getOwner(this).lookup('adapter:application');
    const url = `${adapter.namespace}/autocomplete/organizations`;

    const request = jQuery.ajax({
      url,
      contentType: 'application/json',
      data: {
        name: query
      }
    });

    try {
      const response = yield request;

      return response.data;
    } catch (error) {
      return [];
    } finally {
      request.abort();
    }
  }).restartable(),

  deleteUser: task(function * () {
    try {
      const userId = this.get('user.id');

      let tabs = this.get('tabStore.tabs').slice(0).removeObject(this.get('tabStore.activeTab'))
        .filter((tab) => {
          if (tab.process.get('type') === 'case') {
            return tab.process.get('model.requester.id') === userId;
          }

          if (tab.process.get('type') === 'user') {
            return tab.process.get('model.id') === userId;
          }
        });

      yield this.get('state.deleteUser').perform();

      tabs.forEach((tab) => this.get('tabStore').close(tab));
      this.get('tabStore').closeActiveTab(true);
    }
    catch (e) {
      // User Deletion Failed, API sends notification here
    }
  }).drop(),

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

  persistOrgToUser: task(function * (user, org) {
    let i18n = this.get('i18n');
    user.set('organization', org);
    let opts = {adapterOptions: {setOrganization: true}};

    return yield user.save(opts)
      .then((user) => {
        this.send('setInstantUser', user);
        this.get('notification').success(i18n.t('organization.assignment_passed', {name: user.get('fullName'), org: org.get('name')}));
      })
      .catch(() => {
        this.get('notification').error(i18n.t('organization.assignment_failed'));
        user.set('organization', null);
      });
  }).drop(),

  updateSignature: task(function * () {
    return yield this.get('user').save({adapterOptions: {setSignature: true}});
  }),

  updateName: task(function * (name, oldName) {
    const i18n = this.get('i18n');
    let user = this.get('user');
    user.set('fullName', name);
    try {
      yield user.save({adapterOptions: {updateName: true}});
      this.get('notification').success(i18n.t('users.name_update_success'));
    }
    catch (err) {
      this.get('notification').error(i18n.t('users.name_update_failure'));
      user.set('name', oldName);
      throw err;
    }
    return user;
  }).drop(),

  initGrants: task(function * () {
    if (this.get('user') !== this.get('session.user')) { return; }
    let grants = yield this.get('store').findAll('my-oauth-grant');
    this.set('grants', grants);
  }),

  fetchNotes: task(function * () {
    try {
      let notes = yield this.get('store').query('note', {
        parent: this.get('user'),
        limit: 999
      });
      this.set('user.viewNotes', notes.toArray());
    }
    catch (e) {
      if (!Ember.testing && window.Bugsnag) {
        let context = getMetaData(null, getOwner(this));
        window.Bugsnag.notifyException(e, 'Failed to fetch notes', context, 'info');
      }
    }
  }).restartable(),

  addExternalNote: task(function * (destination) {
    const user = this.get('user.id');
    const organization = this.get('user.organization.id');
    const payload = {
      contents: this.get('state.replyContent'),
      attachmentFileIds: this.get('attachedPostFiles').mapBy('attachmentId').compact()
    };

    const type = destination === 'user' ? 'user' : 'organization';

    let note = yield this.get('store').createRecord('note', payload).save({adapterOptions: { type, user, organization }});
    this.get('state').resetEdits();
    yield this.get('timeline.fetchNewerAfterReply').perform(this.get('filter'));
    this.addNoteToViewNotesIfInNotesMode(note);
  }),

  addNoteToViewNotesIfInNotesMode(note) {
    if (note) {
      this.get('user.viewNotes').addObject(note);
    }
  },

  focusInstantSearch() {
    scheduleOnce('afterRender', () => {
      if (this.isDestroying || this.isDestroyed) { return; }
      this.$(`#${this.get('elementId')}-kie-instant-input`).click();
    });
  },

  findAndClickOnSubjectField() {
    if (this.isDestroying || this.isDestroyed) { return; }
    this.$(`.${styles['timeline-header-body']}`).find('span:not(.ember-view)').click();
  },

  focusSubject() {
    scheduleOnce('afterRender', this, 'findAndClickOnSubjectField');
  },

  findAndTriggerFroalaFocusAction() {
    if (this.isDestroying || this.isDestroyed) { return; }
    this.$(EDITOR_SELECTOR).froalaEditor('events.focus');
  },

  focusFroalaEditor() {
    scheduleOnce('afterRender', this, 'findAndTriggerFroalaFocusAction');
  },

  scheduleCheckingForEditableActiveElement(force) {
    let subject = this.get('user.fullName');

    let el = document.activeElement;
    let isCurrentElementEditable = el && (el.isContentEditable || el.tagName.toUpperCase() === 'INPUT' || el.tagName.toUpperCase() === 'TEXTAREA');
    if (!isCurrentElementEditable || force) {
      if (typeof subject === 'string' && !subject.trim().length && this.get('editedUser')) {
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

  actions: {
    dispatch(method, ...rest) {
      this.get('state')[method](...rest);
    },

    newConversation() {
      let dateStamp = moment().format('YYYY-MM-DD-hh-mm-ss');
      let userId = this.get('user.id');

      this.get('routing').transitionTo(
        'session.agent.cases.new',
        [dateStamp],
        { requester_id: userId }
      );
    },

    setNoteDestination(destination) {
      this.get('state').setNoteDestination(destination);
      debounce(this, 'focusSubjectOrReply', FOCUS_DEBOUNCE_TIME);
    },

    setRole(role) {
      const state = this.get('state');
      const newRoleType = role.get('roleType');
      const oldRoleType = this.get('state.editedUser.role.roleType');
      this.setCaseAccessLevelDefaults(oldRoleType, newRoleType);
      state.setRole(role);
    },

    manageAppAccess() {
      this.set('appAccessModal', true);
    },

    revokeAccess(grant) {
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'users.grant.confirmdelete',
        intlConfirmLabel: 'users.grant.revoke'
      }).then(() => grant.destroyRecord());
    },

    closeAppAccessModal() {
      this.set('appAccessModal', false);
    },

    editSignature(signature) {
      this.set('signatureModal', true);
      this.set('editingSignature', signature);
    },

    closeSignatureModal() {
      this.set('signatureModal', false);
    },

    updateSignature() {
      const i18n = this.get('i18n');
      const oldSign = this.get('editedUser.signature') || this.get('user.signature');
      this.get('state').setSignature(this.get('editingSignature'));
      this.set('user.signature', this.get('editingSignature'));
      this.get('updateSignature').perform()
        .then(() => {
          this.get('notification').success(i18n.t('users.sign_update_success'));
        })
        .catch(() => {
          this.get('notification').error(i18n.t('users.sign_update_failure'));
          this.get('state').setSignature(oldSign);
          this.set('user.signature', oldSign);
        })
        .finally(() => {
          this.set('signatureModal', false);
        });
    },

    setName(name) {
      const oldName = this.get('user.fullName');
      if (name === oldName) { return; }
      this.get('updateName').perform(name, oldName);
      if (this.attrs.onTabNameUpdate) {
        this.attrs.onTabNameUpdate(name);
      }
    },

    changeUserPassword(primaryEmailAddress) {
      const adapter = getOwner(this).lookup('adapter:application');

      adapter.ajax(`${adapter.namespace}/base/password/reset`, 'POST', {
        data: {
          email: primaryEmailAddress
        }
      }).then(() => {
      },
      response => {
        this.get('errorHandler').process(response.responseJSON);
      });
    },

    submit() {
      const destination = this.get('noteDestination.id');

      if (destination === 'org') {
          this.get('addExternalNote').perform(destination);
      }
      else {
        this.get('submit').perform().then(() => {
          if (this.get('tabsModel.organization.name')) {
            this.resetEntityParams();
          }
        }).catch(e => {
          if (!didCancel(e)) {
            throw e;
          }
        });
      }
    },

    setOrganization(org) {
      const processOrganizationPayload = (payload) => {
        let organizationId = get(payload, 'id');
        let data = JSON.parse(JSON.stringify(payload));
        this.get('store').pushPayload({ organization: data });

        return this.get('store').peekRecord('organization', organizationId);
      };

      this.get('state').setOrganization(org ? processOrganizationPayload(org) : org);
    },

    focusEditor() {
      run.later(() => {
        jQuery(EDITOR_SELECTOR).froalaEditor('events.focus');
      });
    },

    openDisableTwoFactorModal() {
      this.set('disableTwoFactorModal', true);
    },

    closeDisableTwoFactorModal() {
      this.set('disableTwoFactorModal', false);
    },

    removeTwoFactorAuth() {
      this.set('remove2FAButtonDisabled', true);

      let userId = this.get('user.id');

      this.get('store')
        .adapterFor('user')
        .removeTwoFactorAuth(userId)
        .then(() => {
          this.set('disableTwoFactorModal', false);
          this.set('remove2FAButtonDisabled', false);
          this.get('notification').add({
            type: 'success',
            title: this.get('i18n').t('users.two_factor.disable.notification'),
            autodismiss: true
          });
        }).then(() => {
          let user = this.get('user');
          return user.reload();
        });
    },

    handleTabbingFromSubject(event) {
      if (event.keyCode === KeyCodes.tab) {
        event.preventDefault();
        this.focusFroalaEditor();
      }
    },

    handleTabbingFromReply(event) {
      if (event.keyCode === KeyCodes.tab) {
        event.preventDefault();

        if (!(this.get('editedUser.fullName') || this.get('user.fullName'))) {
          this.focusSubject();
        }
        else {
          this.focusInstantSearch();
        }
      }
    },

    setInstantUser(user) {
      if (typeof user === 'string') {
        user = user.trim();

        // Create User flow
        let isTwitter = isTwitterHandle(user);

        if (isTwitter) {
          user = user.slice(1);
        }

        let i18n = this.get('i18n');

        let name;
        let id = user;

        let username = id;

        if (!isTwitter) {
          username = id.slice(0, id.indexOf('@'));
        }

        if (username.includes('+')) {
          username = username.slice(0, username.indexOf('+'));
        }

        let [firstName, lastName] = username.split('.');
        name = capitalize(firstName);
        if (lastName && lastName.trim().length) {
          name += ' ' + capitalize(lastName);
        }

        let savePromise = this.get('createUser').perform(name, id, isTwitter);
        savePromise.then((user) => {
          this.get('notification').success(i18n.t('cases.new_conversation.user_created'));

          this.redirectToUser(user.get('id'), user.get('fullName'));
        })
          .finally(() => {
            this.set('instantEntityTerm', '');
            this.set('instantEntityResults', null);
          });
      }
      else {
        this.set('instantEntityTerm', '');
        this.set('instantEntityResults', null);

        this.redirectToUser(user.get('id'), user.get('fullName'));
      }
    },

    handleInstantEntityTabbing(key) {
      if (key === 'TAB') {
        this.focusSubjectOrReply(true);
      }
    },

    setOrganizationModeOn() {
      this.resetEntityParams(true);
    },

    setOrganizationModeOff() {
      this.resetEntityParams();
      this.focusSubjectOrReply(true);
    },

    setInstantOrg(org) {
      if (typeof org === 'string') {
        org = capitalize(org.trim());

        // Create Org flow
        let i18n = this.get('i18n');

        let savePromise = this.get('createOrg').perform(org);
        savePromise.then((org) => {
          this.get('notification').success(i18n.t('organization.created'));
          let user = this.get('user') || this.get('editedUser');
          this.get('persistOrgToUser').perform(user, org);
        })
          .finally(() => {
            this.resetEntityParams();
          });
      }
      else {
        this.resetEntityParams();
        let user = this.get('user') || this.get('editedUser');
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

    onAttachFiles(files) {
      const service = this.get('uploadService');
      const attachedPostFiles = this.get('attachedPostFiles');
      const onUploadAttachmentStart = (...args) => this.get('state').addAttachment(...args);
      const onUploadAttachment = (...args) => this.get('state').updateAttachments(...args);
      files.forEach(file =>
        service.get('uploadFile').perform(file, attachedPostFiles, null, onUploadAttachmentStart, onUploadAttachment).catch(() => { /* Swallow this as this isn't an error we can handle */})
      );
    },

    resetProperties() {
      this.get('state').resetSidebar();
    },
    
    refreshUser() {
      // Reload the user data to reflect changes in organization
      const userId = this.get('user.id');
      if (userId) {
        this.get('store').findRecord('user', userId, { reload: true }).then(user => {
          // Force UI update
          this.notifyPropertyChange('user');
        }).catch(error => {
        });
      }
    }
  },

  resetEntityParams(doSetOrg, doSetReq) {
    this.set('instantEntityTerm', '');
    this.set('instantEntityResults', null);
    this.set('setOrganizationMode', !!doSetOrg);
    this.set('setRequesterMode', !!doSetReq);
  },

  redirectToUser(id, name) {
    let router = this.get('routing');
    this.set('redirectingToUser', true);
    this.set('username', name);

    this.sendAction('openInSameTab');
    router.transitionTo('session.agent.users.user', [id])
      .then(() => {
        this.set('redirectingToUser', false);
      })
      .finally(() => {
        this.set('redirectingToUser', false);
      });
  },

  initRoles() {
    this.get('store').findAll('role').then((roles) => this.set('roles', roles));
  },

  initTeams() {
    this.get('store').findAll('team').then((teams) => {
      this.set('teamRecords', teams);
    });
  },

  initRecentFeedback() {
    if (this.get('user.id')) {
      const state = this.get('state');
      state.set('recentFeedback', []);
      this.get('store').query('rating', {
        limit: 3,
        user_id: this.get('user.id'),
        include: ['case'],
        fields: 'case,score,created_at'
      }).then(ratings => {
        return state.set('recentFeedback', ratings.toArray());
      });
    }
  }
});
