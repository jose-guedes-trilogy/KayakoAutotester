import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  plan: service(),

  beforeModel() {
    return this.get('plan').fetchPlan();
  }
});
