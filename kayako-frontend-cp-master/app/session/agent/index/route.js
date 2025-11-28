import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  plan: service(),

  redirect() {
    this.transitionTo('session.agent.cases');
  }
});
