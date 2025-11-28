import Controller from '@ember/controller';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Controller.extend({
  store: service(),
  i18n: service(),
  notification: service(),
  virtualModel: service(),

  settings: null,
  settingsObj: null,
  wasEnabled: false,
  isEnabled: false,
  isRunning: false,

  onCancel: () => {},

  initEdits() {
    const settingsObj = {};
    this.get('settings').forEach(setting => {
      settingsObj[setting.get('name')] = setting.get('value');
    });
    this.set('isEnabled', ['ENABLED', 'ACTIVE'].includes(settingsObj.status));
    this.set('wasEnabled', ['ENABLED', 'ACTIVE'].includes(settingsObj.status));
    this.set('settingsObj', settingsObj);
  },

  isEdited() {
    return this.get('isEnabled') !== this.get('wasEnabled');
  },

  label: computed('settingsObj.status', 'isEnabled', 'wasEnabled', function() {
    if (this.isEdited()) {
      const isEnabled = this.get('isEnabled');
      if (isEnabled) {
        return this.get('i18n').t('admin.apps.atlasai.will_be_enabled');
      } else {
        return this.get('i18n').t('admin.apps.atlasai.will_be_disabled');
      }
    }
    const status = this.get('settingsObj').status;
    switch (status) {
      case 'ACTIVE':
        return this.get('i18n').t('admin.apps.atlasai.active');
      case 'ENABLED':
        return this.get('i18n').t('admin.apps.atlasai.enabled');
      case 'DISABLED':
        return this.get('i18n').t('admin.apps.atlasai.disabled');
      default:
        return this.get('i18n').t('admin.apps.atlasai.disabled');
    }
  }),

  save: task(function* () {
    if (!this.isEdited()) {
      return;
    }
    this.set('isRunning', true);
    this.set('errors', {});
    try {
      const isEnabled = this.get('isEnabled');
      const adapter = this.store.adapterFor('atlasai');

      (isEnabled ? adapter.register() : adapter.deregister())
        .then(response => {
          this.get('notification').add({
            type: 'success',
            title: this.get('i18n').t('generic.changes_saved'),
            autodismiss: true
          });

          // Update settingsObj based on the response
          const updatedSettings = response.data.reduce((acc, setting) => {
            acc[setting.name] = setting.value;
            return acc;
          }, {}); 

          this.set('settingsObj', updatedSettings);
          this.set('wasEnabled', isEnabled);
          this.set('isRunning', false);
        })
        .catch(error => {
          if (error.errors) {
            let errors = {};
            error.errors.forEach(({ parameter, message }) => {
              errors[parameter] = [{ message }];
            });
            this.set('errors', errors);
          }
          this.set('isRunning', false);
        });
    } catch (e) {
      this.set('isRunning', false);
    }
  }).drop(),

  actions: {
    toggle(enabled) {
      this.set('isEnabled', enabled);
    }
  }
});
