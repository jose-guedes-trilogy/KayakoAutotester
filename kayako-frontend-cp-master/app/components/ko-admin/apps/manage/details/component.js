import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads, bool } from '@ember/object/computed';
import { task } from 'ember-concurrency';

export default Component.extend({

  appsService: service('apps'),

  app: null,

  onInstall: () => {},
  onUninstall: () => {},

  installedApps: reads('appsService.installedApps'),

  installedApp: computed('installedApps.[]', 'app.id', function() {
    return this.get('installedApps').findBy('app.id', this.get('app.id'));
  }),

  isInstalled: bool('installedApp'),

  install: task(function* () {
    const app = this.get('app');
    const installation = yield this.get('appsService').install(app);
    return yield this.get('onInstall')(installation);
  }).drop(),

  uninstall: task(function* () {
    const installation = this.get('installedApp');
    yield this.get('appsService').uninstall(installation);
    return yield this.get('onUninstall')(installation);
  }).drop()

});
