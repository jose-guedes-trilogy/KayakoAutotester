import { readOnly } from '@ember/object/computed';
import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import settings from './settings';

export default Controller.extend({
  // Attributes
  settings: null,
  editedSettings: null,

  // Services
  i18n: service(),
  notification: service(),
  settingsService: service('settings'),
  virtualModel: service(),

  // CPs
  tabs: computed(function () {
    return [{
      id: 'organization',
      label: this.get('i18n').t('admin.email.tabs.mailboxes'),
      routeName: 'session.admin.channels.email.index',
      dynamicSegments: []
    }, {
      id: 'user',
      label: this.get('i18n').t('admin.email.tabs.settings'),
      routeName: 'session.admin.channels.email.settings',
      dynamicSegments: []
    }];
  }),

  hasChanges: readOnly('editedSettings.isEdited'),

  schema: computed(function () {
    return this.get('settingsService').generateSchema(settings);
  }),

  domain: computed(function () {
    return window.location.hostname;
  }),

  // Actions
  actions: {
    editBooleanSetting(settingName, value) {
      this.set(`editedSettings.${settingName}.value`, value ? '1' : '0');
    },

    save() {
      return this.get('virtualModel').save(this.get('settings'), this.get('editedSettings'), this.get('schema'));
    },

    cancel() {
      this.transitionToRoute('session.admin.channels.email');
    },

    handleSuccess() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.transitionToRoute('session.admin.channels.email');
    }
  },

  // Methods
  initEdits() {
    this.set('editedSettings', this.get('settingsService').initEdits(this.get('settings'), this.get('schema')));
  },

  isEdited() {
    return this.get('hasChanges');
  }
});
