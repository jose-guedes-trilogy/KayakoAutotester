import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  metrics: service(),
  i18n: service(),
  permissions: service(),

  tabs: computed(function () {
    return [{
      label: this.get('i18n').t('admin.apps.api.tabs.api'),
      routeName: 'session.admin.apps.api.index',
      dynamicSegments: []
    }, {
      label: this.get('i18n').t('admin.apps.api.tabs.oauth_apps'),
      routeName: 'session.admin.apps.api.oauth-apps',
      dynamicSegments: []
    }];
  }),

  canManageOAuthApps: computed(function () {
    return this.get('permissions').has('apps.manage');
  }),

  actions: {
    ctaClick() {
      if (variation('ops-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'API - View landing page',
          category: 'Admin'
        });
      }
    }
  }
});
