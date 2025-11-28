import { inject as service } from '@ember/service';
import { readOnly } from '@ember/object/computed';
import Controller from '@ember/controller';
import { computed } from '@ember/object';
import settings from './settings';
import { task } from 'ember-concurrency';
import commaSeparateList from 'frontend-cp/lib/comma-separate-list';

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

  // CPs
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
    },

    setCommaSeparatedField(settingName, e) {
      const value = e.target.value;
      this.set(settingName, value);
      this.set(`editedSettings.${settingName}.value`, commaSeparateList(value));
    }
  },

  // Methods
  initEdits() {
    this.set('editedSettings', this.get('settingsService').initEdits(this.get('settings'), this.get('schema')));
    const whitelist = this.get('editedSettings.users_email_whitelist.value');
    const blacklist = this.get('editedSettings.users_email_blacklist.value');
    // Adding newline at the end so that when the field is activated, user can type straight
    // away to add a new entry
    this.set('editedEmailWhitelist', whitelist ? whitelist.split(',').join('\n') + '\n' : whitelist);
    this.set('editedEmailBlacklist', blacklist ? blacklist.split(',').join('\n') + '\n' : blacklist);
  },

  isEdited() {
    return this.get('hasChanges');
  }
});
