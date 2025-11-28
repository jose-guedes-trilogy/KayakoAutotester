import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {

  model() {
    return this.store.findAll('atlasai', { reload: true });
  },

  // Services
  setupController(controller, settings) {
    controller.set('settings', settings);
    controller.initEdits();
  }
});

