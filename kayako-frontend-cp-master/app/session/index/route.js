import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  sessionService: service('session'),

  beforeModel(transition) {
    this.transitionTo('session.agent');
  }
});
