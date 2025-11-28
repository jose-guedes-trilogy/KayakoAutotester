import EmberObject from '@ember/object';
import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';

export default Route.extend(DirtyAwareRoute(), {
  model() {
    return this.store.findAll('setting', {reload: true});
  },

  setupController(controller, model) {
    controller.set('originalSettings', EmberObject.create({
      default_language: model.findBy('key', 'account.default_language').get('value'),
      timezone: model.findBy('key', 'account.timezone').get('value'),
      time_format: model.findBy('key', 'account.time_format').get('value')
    }));
    controller.set('currentSettings', EmberObject.create({
      default_language: model.findBy('key', 'account.default_language').get('value'),
      timezone: model.findBy('key', 'account.timezone').get('value'),
      time_format: model.findBy('key', 'account.time_format').get('value')
    }));
  }
});
