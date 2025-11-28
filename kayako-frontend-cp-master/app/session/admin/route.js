import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';

export default Route.extend({
  active: false,
  permissions: service(),

  beforeModel(transition) {
    if (!this.get('permissions').has('app.admin.access')) {
      this.get('permissions').showError();
      this.transitionTo('session.agent');
    } else if (transition.queryParams.trial === 'true') {
      this.transitionTo('session.agent.welcome', { queryParams: { trial: 'true' }});
    }
    return RSVP.hash({
      locales: this.store.findAll('locale')
    });
  },

  activate() {
    this.set('active', true);
  },

  deactivate() {
    this.set('active', false);
  },

  actions: {
    loading(transition, originRoute) {
      let controller = this.controllerFor('session.admin');
      controller.set('isLoading', true);
      transition.promise.finally(() => {
        controller.set('isLoading', false);
      });
      return true;
    }
  }
});
