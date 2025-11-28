import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  active: false,
  macro: service(),
  session: service(),

  beforeModel(transition) {
    if (transition.queryParams.trial === 'true' && this.get('session.user.role.isAdminOrHigher')) {
      this.replaceWith('session.agent.welcome');
    }
  },
  afterModel() {
    this.get('macro').fetchMacros();
    return this._super(...arguments);
  },

  activate() {
    this.set('active', true);
  },

  deactivate() {
    this.set('active', false);
  },

  actions: {
    error(error, transition) {
      if (error) {
        console.error(error); // eslint-disable-line no-console
        return this.transitionTo('session.agent.cases.index');
      }
    }
  }
});
