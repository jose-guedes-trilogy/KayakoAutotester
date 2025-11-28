import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ENV from 'frontend-cp/config/environment';

export default Route.extend({
  launchDarkly: service(),
  eventedRouter: service(),
  localClient: service('launchDarklyClientLocal'),

  beforeModel() {
    const user = {
      key: window.location.hostname,
      anonymous: true,
      custom: {
        host: window.location.hostname,
        appVersion: ENV.currentRevision
      }
    };

    return this.get('launchDarkly').initialize(user)
      .catch(() => this._handleLaunchDarklyFailure(user));
  },

  _handleLaunchDarklyFailure(user) {
    let service = this.get('launchDarkly');
    let localClient = this.get('localClient');
    service.set('_client', localClient);

    return service.initialize(user);
  },

  actions: {
    didTransition() {
      this.get('eventedRouter').trigger('didTransition');
      return true;
    }
  }
});
