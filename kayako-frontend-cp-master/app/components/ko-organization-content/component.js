import Component from '@ember/component';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import EmberObject from '@ember/object';
import { run } from '@ember/runloop';
import $ from 'jquery';
import { task, didCancel } from 'ember-concurrency';
import { capitalize } from '@ember/string';
import diffAttrs from 'ember-diff-attrs';
import { EDITOR_SELECTOR } from 'frontend-cp/components/ko-text-editor/component';
import { getMetaData } from 'frontend-cp/utils/bugsnag';
import { getOwner } from '@ember/application';
import isInternalTag from '../../utils/is-internal-tag';

export default Component.extend(KeyboardShortcuts, {
  tagName: '',

  // Attributes
  filter: '',
  routeContext: '',
  postId: null,
  organization: null,
  canDelete: false,
  tabId: null,
  tabsComponent: null,
  tabsModel: null,
  redirectingToOrg: false,
  orgMembers: null,
  orgName: '',
  instantOrgTerm: '',
  instantOrgResults: null,
  newOrgController: null,
  timestamp: null,
  openInSameTab: () => {},

  closeTab: null,

  // State
  state: null,

  // Services
  i18n: service(),
  permissions: service(),
  customFieldsList: service('custom-fields/list'),
  plan: service(),
  store: service(),
  notification: service(),
  routing: service('-routing'),
  uploadService: service('fileUpload'),

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

  attachedPostFiles: computed.readOnly('state.attachedPostFiles'),
  uploadingFiles: computed.readOnly('uploadService.uploadFile.isRunning'),


  visibleTags: computed('state.editedTags.@each.name', function() {
    return this.get('state.editedTags').filter(tag => {
      return !isInternalTag(tag);
    });
  }),

  // Lifecycle hooks
  didReceiveAttrs: diffAttrs('organization', function(changedAttrs, ...args) {
    this._super(...args);

    if (!changedAttrs || changedAttrs.organization) {
      this.set('orgMembers', null);
      if (this.get('organization.id')) {
        this.get('loadOrganizationMembers').perform().then(members => {
          this.set('orgMembers', members);
        }).catch(e => {
          if (!didCancel(e)) {
            throw e;
          }
        });
      }
    }
  }),

  // Methods
  redirectToOrg(id, name) {
    const router = this.get('routing');
    this.set('redirectingToOrg', true);
    this.set('orgName', name);

    this.sendAction('openInSameTab');
    router.transitionTo('session.agent.organizations.organization', [id])
      .then(() => {
        this.set('redirectingToOrg', false);
      })
      .finally(() => {
        this.set('redirectingToOrg', false);
      });
  },

  // State attributes
  isSaving: computed.or('state.save.isRunning', 'state.postNote.isRunning', 'updateName.isRunning'),

  // CPs
  hasOrg: computed('organization.name', function () {
    return typeof this.get('organization.name') === 'string';
  }),

  hasOrganizationUpdatePermission: computed(function() {
    return this.get('permissions').has('organizations.update');
  }),

  isSharedOrganization: computed(function() {
    return this.get('plan').has('shared_organizations');
  }),

  canUpdateOrganization: computed('state.hasUpdateOrganizationPermission', 'isSaving', function() {
    return this.get('state.hasUpdateOrganizationPermission') && !this.get('isSaving');
  }),

  canPostOrganizationNote: computed('role', function() {
    return this.get('permissions').has('app.organization.post_private_note', this.get('organization'));
  }),

  caseAccessList: computed(function() {
    return [
      EmberObject.create({
        name: this.get('i18n').t('organization.infobar.cases.shared.true'),
        value: true
      }),
      EmberObject.create({
        name: this.get('i18n').t('organization.infobar.cases.shared.false'),
        value: false
      })
    ];
  }),

  loadOrganizationMembers: task(function * () {
    let results = yield this.get('store').adapterFor('organization').fetchMembers(this.organization.id);

    return results.data;
  }),

  stateIsUnmodified: computed.not('state.isEdited'),
  submitDisabled: computed.or('isSaving', 'stateIsUnmodified', 'uploadingFiles'),

  organizationDates: computed('organization.createdAt', 'organization.updatedAt', function() {
    return [
      {
        title: this.get('i18n').t('users.metadata.created'),
        value: this.get('organization.createdAt'),
        type: 'created'
      },
      {
        title: this.get('i18n').t('users.metadata.updated'),
        value: this.get('organization.updatedAt'),
        type: 'updated'
      }
    ];
  }),

  updatedDate: computed('organizationDates.[]', function() {
    return this.get('organizationDates').findBy('type', 'updated');
  }),

  customFields: computed('organization.customFields', function() {
    return this.get('organization.customFields')
      .mapBy('field')
      .compact()
      .sortBy('sortOrder');
  }),

  // Tasks
  submit: task(function * () {
    if (this.get('submitDisabled')) {
      return;
    }
    const { state } = this.getProperties('state');
    try {
      yield state.get('submit').perform();
      let note = yield this.get('timeline.fetchNewerAfterReply').perform(this.get('filter'));
      note = note.filterBy('note.id').get('firstObject.note.content');
      if (note) {
        this.get('organization.viewNotes').addObject(note);
      }
    } catch (e) {
      if (e.message !== 'The adapter rejected the commit because it was invalid') {
        throw e;
      }
    }
  }).drop(),

  createOrg: task(function * (name) {
    let store = this.get('store');

    return yield store.createRecord('organization', { name }).save();
  }).drop(),

  updateName: task(function * (name, oldName) {
    const i18n = this.get('i18n');
    let org = this.get('organization');
    org.set('name', name);
    try {
      yield org.save({adapterOptions: {updateName: true}});
      this.get('notification').success(i18n.t('organization.name_update_success'));
    }
    catch (err) {
      org.set('name', oldName);
      throw err;
    }
    return org;
  }).drop(),

  fetchNotes: task(function * () {
    try {
      let notes = yield this.get('store').query('note', {
        parent: this.get('organization'),
        limit: 999
      });
      this.set('organization.viewNotes', notes.toArray());
    }
    catch (e) {
      if (!Ember.testing && window.Bugsnag) {
        let context = getMetaData(null, getOwner(this));
        window.Bugsnag.notifyException(e, 'Failed to fetch notes', context, 'info');
      }
    }
  }).restartable(),

  // Actions
  actions: {
    dispatch(method, ...rest) {
      this.get('state')[method](...rest);
    },

    focusEditor() {
      run.later(() => {
        $(EDITOR_SELECTOR).froalaEditor('events.focus');
      });
    },

    submit() {
      this.get('submit').perform();
    },

    setName(name) {
      const oldName = this.get('organization.name');
      if (name === oldName) { return; }
      this.get('updateName').perform(name, oldName);
      if (this.attrs.onTabNameUpdate) {
        this.attrs.onTabNameUpdate(name);
      }
    },

    setInstantOrg(org) {
      if (typeof org === 'string') {
        org = org.trim();

        // Create Org flow

        let i18n = this.get('i18n');

        org = capitalize(org);

        let savePromise = this.get('createOrg').perform(org);
        savePromise.then((org) => {
          this.get('notification').success(i18n.t('organization.created'));

          this.redirectToOrg(org.get('id'), org.get('name'));
        })
          .finally(() => {
            this.set('instantOrgTerm', '');
            this.set('instantOrgResults', null);
          });
      }
      else {
        this.set('instantOrgTerm', '');
        this.set('instantOrgResults', null);

        this.redirectToOrg(org.get('id'), org.get('name'));
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
    }
  }
});
