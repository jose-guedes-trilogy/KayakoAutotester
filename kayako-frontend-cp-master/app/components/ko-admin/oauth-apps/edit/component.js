import $ from 'jquery';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { not } from '@ember/object/computed';
import { task } from 'ember-concurrency';

const MODE_ALL_SCOPES = 'all';
const MODE_SPECIFIED_SCOPES = 'specified';

const ACCESS_WRITE = 'write';
const ACCESS_READ = 'read';

export default Component.extend({
  tagName: '',
  i18n: service(),
  notification: service(),
  virtualModel: service(),
  session: service(),
  app: null,
  editedApp: null,
  schema: null,
  onCancel: null,
  onDelete: null,
  onDone: null,
  isCreated: false,
  isUploading: false,

  canBeDeleted: not('app.isNew'),

  appLogo: computed('app.logo', function() {
    return {
      id: 0,
      url: this.get('app.logo.url'),
      data: null
    };
  }),

  selectedScopeMode: computed('app.scopes', function() {
    if (this.get('app.scopes').length > 0) {
      return MODE_SPECIFIED_SCOPES;
    } else {
      return MODE_ALL_SCOPES;
    }
  }),

  scopeModes: [MODE_ALL_SCOPES, MODE_SPECIFIED_SCOPES],

  scopes: computed('app.scopes', function() {
    const scopes = [];
    const usedScopes = [];
    this.get('app.scopes').forEach(name => {
      const [scope, level] = name.split(':', 2);
      usedScopes[scope] = level ? level : ACCESS_WRITE;
    });
    ['users', 'conversations', 'insights', 'search', 'configuration'].forEach(name => {
      const scope = {
        name: name,
        isEnabled: usedScopes.hasOwnProperty(name),
        level: usedScopes.hasOwnProperty(name) ? usedScopes[name] : ACCESS_WRITE
      };
      scopes.push(scope);
    });
    return scopes;
  }),

  scopeAccess: [ACCESS_WRITE, ACCESS_READ],

  getSelectedScopes() {
    return this.get('scopes')
      .filter(scope => scope.isEnabled)
      .map(scope => scope.name + ':' + scope.level);
  },

  uploadFile(image) {
    let formData = new FormData();
    let { sessionId, csrfToken } = this.get('session').getProperties('sessionId', 'csrfToken');

    formData.append('name', image.name);
    formData.append('content', image);

    this.set('isUploading', true);

    $.ajax({
      url: '/api/v1/files',
      type: 'POST',
      headers: {
        'X-Session-ID': sessionId,
        'X-CSRF-Token': csrfToken
      },
      data: formData,
      success: response => {
        this.set('appLogo.id', response.data.id);
        this.set('isUploading', false);
      },
      error: response => {
        this.get('notification')
          .error(this.get('i18n').t('admin.oauthapps.edit.upload.failure'));
        this.set('isUploading', false);
      },
      cache: false,
      contentType: false,
      processData: false
    });
  },

  finish: task(function * () {
    this.get('onDone')();
  }),

  actions: {
    save() {
      const logoFileId = this.get('appLogo.id');
      if (logoFileId) {
        this.set('editedApp.logoFileId', logoFileId);
      }
      this.set('editedApp.scopes', this.getSelectedScopes());
      const app = this.get('app');
      const editedApp = this.get('editedApp');
      const schema = this.get('schema');
      return this.get('virtualModel').save(app, editedApp, schema);
    },

    triggerUpload() {
      $('#oauth-client-logo-file-field').click();
    },

    uploadLogo(files) {
      const image = files[0];

      if (image.type.includes('image')) {
        let reader = new FileReader();

        reader.onload = () => {
          this.set('appLogo.url', null);
          this.set('appLogo.data', reader.result);
        };

        reader.readAsDataURL(image);
        this.uploadFile(image);
      } else {
        this.get('notification')
          .error(this.get('i18n').formatHtmlMessage('admin.oauthapps.edit.upload.incorrect_file_type', { filename: image.name }));
      }
    },

    copiedToClipboard() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.copied_to_clipboard'),
        autodismiss: true
      });
    }
  }
});
