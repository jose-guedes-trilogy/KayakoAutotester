import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  session: service(),
  errorHandler: service(),
  locale: service(),

  beforeModel() {
    // we ignore errors before locale strings are loaded
    return this.get('errorHandler').disableWhile(() => {
      return this.get('locale').setup();
    });
  },

  deactivate() {
    this.controller.set('wakingUp', false);
    this.controller.set('awakened', false);
  },

  model() {
    return this.get('session').getSession().catch(() => {});
  }
});
