import { inject as service } from '@ember/service';
import { readOnly } from '@ember/object/computed';
import Controller from '@ember/controller';
import { computed } from '@ember/object';
import settings from './settings';
import { task } from 'ember-concurrency';

export default Controller.extend({
  // Attributes
  settings: null,
  editedSettings: null,

  // Services
  i18n: service(),
  notification: service(),
  settingsService: service('settings'),
  virtualModel: service(),
  confirmation: service(),
  plan: service(),

  // CPs
  tabs: computed(function() {
    let tabs = [{
      id: 'case',
      label: this.get('i18n').t('admin.settings.security.tabs.help_center'),
      routeName: 'session.admin.security.policy.help-center',
      dynamicSegments: [],
      queryParams: null
    }];

    if (this.get('plan').has('custom_security_policy')) {
      const customPolicies = [{
        id: 'case',
        label: this.get('i18n').t('admin.settings.security.tabs.agents'),
        routeName: 'session.admin.security.policy.index',
        dynamicSegments: [],
        queryParams: null
      },
      {
        id: 'case',
        label: this.get('i18n').t('admin.settings.security.tabs.customers'),
        routeName: 'session.admin.security.policy.customers',
        dynamicSegments: [],
        queryParams: null
      }];
      tabs = customPolicies.concat(tabs);
    }
    return tabs;
  }),

  hasChanges: readOnly('editedSettings.isEdited'),

  schema: computed(function () {
    return this.get('settingsService').generateSchema(settings);
  }),

  // Tasks
  save: task(function * () {
    try {
      yield this.get('virtualModel').save(this.get('settings'), this.get('editedSettings'), this.get('schema'));

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });
      this.initEdits();
    } catch (e) {
      // intentional
    }
  }).drop(),

  cancel: task(function * () {
    if (this.get('isEdited')) {
      yield this.get('confirmation').confirm({
        intlConfirmationHeader: 'generic.confirm.lose_changes_header',
        intlConfirmationBody: 'generic.confirm.lose_changes',
        intlConfirmLabel: 'generic.confirm.lose_changes_button'
      });
      this.initEdits();
    }
  }).drop(),

  // Actions
  actions: {
    editBooleanSetting(settingName, value) {
      this.set(`editedSettings.${settingName}.value`, value ? '1' : '0');
    },

    editTextSetting(settingName, e) {
      this.set(`editedSettings.${settingName}.value`, e.target.value);
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
