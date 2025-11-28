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
import { task, timeout } from 'ember-concurrency';
import { attr, fragment, many, model } from 'frontend-cp/services/virtual-model';
import { jsonToObject } from 'frontend-cp/utils/object';
import convertErrorsToMap from 'frontend-cp/lib/convert-errors-to-map';
import { assign } from '@ember/polyfills';
import { inject as service } from '@ember/service';
import UploadFile from 'frontend-cp/lib/upload-file';
import Evented from '@ember/object/evented';
import { variation } from 'ember-launch-darkly';

const organizationSchema = model('organization', {
  name: attr(),
  isShared: attr(),
  domains: many(model('identity-domain', {
    id: attr(),
    domain: attr()
  })),
  customFields: many(fragment('organization-field-value', {
    field: attr(),
    value: attr()
  }))
});

const cleanupAttachments = (attachments) => {
  attachments.removeObjects(attachments.filter(attachment => !isEmpty(attachment.get('error'))));
  return attachments;
};

export default EmberObject.extend(Evented, {
  organization: null,
  editedOrganization: null,
  errorMap: null,
  posts: null,
  bottomPostsAvailable: false,
  topPostsAvailable: true,
  customFields: null,
  editedTags: null,
  replyContents: '',
  tab: null,
  attachedPostFiles: null,

  // Services (injected externally)
  i18n: service(),
  notification: service(),
  permissions: service(),
  store: service(),
  tabStore: service(),
  tagsService: service('tags'),
  virtualModel: service(),

  init() {
    this._super(...arguments);
    this.resetEdits();
    const savedState = jsonToObject(this.get('tab').state.organization);

    // attachments should be re-created as correct UploadFile objects
    if (savedState.attachedPostFiles) {
      savedState.attachedPostFiles = savedState.attachedPostFiles.map(attachment =>
        UploadFile.create(attachment)
      );
    }

    this.setProperties(savedState);
    this.persistTabState();
  },

  resetPosts(postId) {
    this.setProperties({
      posts: [],
      topPostsAvailable: true,
      bottomPostsAvailable: Boolean(postId)
    });
  },

  resetEdits() {
    this.resetSidebar();
    this.setProperties({
      attachedPostFiles: [],
      replyContents: ''
    });
  },

  resetSidebar() {
    const organization = this.get('organization');
    const editedOrganization = this.get('virtualModel').makeSnapshot(organization, organizationSchema);

    this.setProperties({
      errorMap: EmberObject.create(),
      editedOrganization,
      customFields: EditedCustomFields.create({
        originalCustomFields: this.get('organization.customFields'),
        editedCustomFields: editedOrganization.get('customFields')
      }),
      editedTags: this.get('organization.tags').map(tag => {
        return EmberObject.create({ name: tag.get('name'), isNew: false });
      })
    });
  },

  persistTabState() {
    this.get('tabStore').updateState(this.get('tab'), {
      organization: assign(this.getProperties(
        'replyContents',
        'attachedPostFiles'
      ), {
        _isEdited: this.get('isEdited')
      })
    });
  },

  setCaseAccess(sharedState) {
    this.set('editedOrganization.isShared', sharedState);
    this.set('errorMap.is_shared', null);
  },

  addDomain({ domain }) {
    this.get('editedOrganization.domains').pushObject({
      domain,
      isNew: !this.get('organization.domains').findBy('domain', domain)
    });
    this.set('errorMap.domains', null);
  },

  removeDomain(domain) {
    this.get('editedOrganization.domains').removeObject(domain);
    this.set('errorMap.domains', null);
  },

  addTag({ name, actualName }) {
    this.get('editedTags').pushObject({
      name: actualName || name,
      isNew: !this.get('organization.tags').find(tag => tag.get('name') === (actualName || name))
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

  setCustomField(field, value) {
    if (value) {
      value = get(value, 'id') || value;
    }
    this.get('errorMap').set(field.get('key'), false);
    this.get('customFields').setValue(field, value);
  },

  setReplyContents(replyContents) {
    this.set('replyContents', replyContents);
    this.persistTabState();
  },

  // Tasks
  submit: task(function * () {
    const task = this.get('isContentEdited') ? 'saveEverything' : 'updateProperties';
    yield this.get(task).perform();
    this.get('notification').add({
      type: 'success',
      title: this.get('i18n').t('organization.updated'),
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

  save: task(function * () {
    if (!this.get('hasUpdateOrganizationPermission')) {
      return;
    }

    const organization = this.get('organization');
    const originalTags = organization.get('tags').map(tag => tag);
    const tagsService = this.get('tagsService');
    const tags = this.get('editedTags').map(tag => tagsService.getTagByName(get(tag, 'name')));

    organization.setProperties({ tags });

    try {
      yield this.get('virtualModel').save(organization, this.get('editedOrganization'), organizationSchema);
      yield organization.get('tags').reload();
      // Get rid of unsaved domains and tags hanging around
      organization.set('tags', organization.get('tags').filterBy('isNew', false));
      organization.set('domains', organization.get('domains').filter(domain => !domain.get('isNew')));
      this.persistTabState();
      if (variation('release-apps')) {
        this.trigger('updated');
      }
    } catch (e) {
      this.set('errorMap', convertErrorsToMap(e.errors));
      organization.setProperties({ tags: originalTags });
      throw e;
    }
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

    const contents = this.get('replyContents').trim();
    yield this.get('store').createRecord('organization-note', {
      contents,
      organization: this.get('organization'),
      attachmentFileIds: attachmentIds
    }).save();
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

  // CPs
  hasUpdateOrganizationPermission: computed(function() {
    return this.get('permissions').has('organizations.update');
  }),

  isCaseAccessEdited: computed('organization.isShared', 'editedOrganization.isShared', function () {
    return this.get('organization.isShared') !== this.get('editedOrganization.isShared');
  }),

  isDomainsEdited: computed('editedOrganization.domains.@each.domain', 'organization.domains.@each.domain', function () {
    let editedDomains = this.get('editedOrganization.domains').compact().mapBy('domain').compact();
    let domains = this.get('organization.domains').compact().mapBy('domain').compact();
    return editedDomains.length !== domains.length || _.intersection(editedDomains, domains).length !== domains.length;
  }),

  isTagsFieldEdited: computed('editedTags.@each.name', 'organization.tags.@each.name', function() {
    let editedTags = this.get('editedTags').mapBy('name');
    let tags = this.get('organization.tags').mapBy('name');
    return editedTags.length !== tags.length || _.intersection(editedTags, tags).length !== tags.length;
  }),

  isContentEdited: computed('replyContents', function() {
    return this.get('replyContents').trim() !== '';
  }),

  arePropertiesEdited: or('isDomainsEdited', 'isCaseAccessEdited',
    'customFields.isEdited', 'isTagsFieldEdited'),

  isEdited: or('isContentEdited', 'arePropertiesEdited'),

  // We have to set this magic property, because after
  // save/restore stte operation, computed property will
  // stop updating.
  isEditedChanged: observer('isEdited', function() {
    scheduleOnce('sync', this, 'persistTabState');
  })
});
