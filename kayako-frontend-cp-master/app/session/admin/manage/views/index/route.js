import Route from '@ember/routing/route';
import config from 'frontend-cp/config/environment';

export default Route.extend({
  model() {
    return this.store.query('view', {show_all: true, limit: config.APP.views.maxLimit});
  }
});
