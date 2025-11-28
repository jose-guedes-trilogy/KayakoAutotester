import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';

export default Route.extend({
  appsService: service('apps'),
  store: service(),

  model({ app_installation_id }) {
    return RSVP.hash({
      installedApp: this.get('appsService.installedApps').findBy('id', app_installation_id),
      prompts: this.get('store').query('app-installation-prompt', { app_installation_id })
    });
  },

  setupController(controller, { installedApp, prompts }) {
    controller.set('installedApp', installedApp);
    controller.set('prompts', prompts);
  }
});
