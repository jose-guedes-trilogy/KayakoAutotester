import Component from '@ember/component';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Component.extend({
  installedApp: null,
  prompts: null,

  appsService: service('apps'),

  app: reads('installedApp.app'),

  onSave: () => {},
  onCancel: () => {},
  onUninstall: () => {},

  values: null,

  init() {
    this._super(...arguments);

    const values = {};
    const prompts = this.get('prompts');

    prompts.forEach(prompt => {
      const { key, value } = prompt.getProperties('key', 'value');
      values[key] = value;
    });

    this.set('values', values);
  },

  save: task(function* () {
    const installation = this.get('installedApp');
    const values = this.get('values');

    yield this.get('appsService').updatePrompts(installation, values);
    return yield this.get('onSave')();
  }).drop(),

  uninstall: task(function* () {
    const installation = this.get('installedApp');
    yield this.get('appsService').uninstall(installation);
    return yield this.get('onUninstall')(installation);
  }).drop(),

  actions: {
    updateValue(key, value) {
      const values = this.get('values');
      values[key] = value;
    }
  }

});
