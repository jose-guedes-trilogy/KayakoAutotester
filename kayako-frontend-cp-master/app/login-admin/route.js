import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  sessionService: service('session'),

  beforeModel(transition) {
    const sessionService = this.get('sessionService');
    return sessionService.getSession().then(() => {
      this.transitionTo('session.admin');
    }, () => {
      sessionService.set('loginRedirectPath', 'session.admin');
      this.transitionTo('login-agent');
    });
  }
});
