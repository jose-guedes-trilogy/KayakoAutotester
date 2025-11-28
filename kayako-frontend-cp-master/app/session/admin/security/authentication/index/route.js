import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';
import settings from './settings';

export default Route.extend(DirtyAwareRoute(), {
  // Services
  settingsService: service('settings'),

  setupController(controller) {
    controller.set('settings', this.get('settingsService').selectByKeys(settings));
    controller.initEdits();
  }
});
