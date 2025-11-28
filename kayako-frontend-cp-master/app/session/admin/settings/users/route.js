import Route from '@ember/routing/route';
import Ember from 'ember';

export default Route.extend({
  redirect() {
    if (!Ember.testing && window.Bugsnag) {
      window.Bugsnag.notify('ObsoleteRoute', 'An obsolete route was used', { route: this.get('routeName') }, 'info');
    }
    this.transitionTo('session.admin.security.settings');
  }
});
