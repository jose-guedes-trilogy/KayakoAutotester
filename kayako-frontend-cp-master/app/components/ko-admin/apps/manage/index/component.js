import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Component.extend({

  appsService: service('apps'),

  // passed in
  apps: null,

  installedApps: reads('appsService.installedApps'),
  availableApps: computed('apps.[]', 'installedApps.[]', function() {
    // return [];
    const installedIDs = this.get('installedApps').mapBy('app.id');
    return this.get('apps').reject(app => installedIDs.includes(app.get('id')));
  }),

  install: task(function* (app) {
    const installation = yield this.get('appsService').install(app);
    return yield this.get('onInstall')(installation);
  }).drop(),

  uninstall: task(function* (installation) {
    yield this.get('appsService').uninstall(installation);
    return yield this.get('onUninstall')(installation);
  }).drop()

});
