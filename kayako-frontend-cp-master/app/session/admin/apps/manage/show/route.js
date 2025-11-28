import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  store: service(),

  model({ app_id }) {
    return this.get('store').findRecord('app', app_id);
  },

  setupController(controller, app) {
    controller.set('app', app);
  }
});
