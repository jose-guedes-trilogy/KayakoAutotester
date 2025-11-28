import DS from 'ember-data';
import config from 'frontend-cp/config/environment';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

const DEV_APPS_SERVER_HOST = 'https://localhost:5000';

export default DS.JSONAPIAdapter.extend({
  session: service(),
  apps: service(),

  host: computed('apps.isDevMode', function() {
    if (this.get('apps.isDevMode')) {
      return DEV_APPS_SERVER_HOST;
    } else {
      return config.appsApiUrl;
    }
  }),

  defaultSerializer: 'apps',
  namespace: 'api/v1',

  headers: computed('session.sessionId', 'session.csrfToken', function () {
    let { sessionId, csrfToken } = this.get('session').getProperties('sessionId', 'csrfToken');

    let headers = {
      'X-CSRF-Token': csrfToken,
      'X-Session-ID': sessionId,
      'X-Instance-Domain': this.get('session.session.instanceName'),
      'X-User-Agent': this.get('session.session.userAgent')
    };

    return headers;
  }).volatile()

});
