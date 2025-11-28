import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  i18n: service(),
  confirmation: service(),

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

  actions: {
    transitionToNewOAuthAppRoute() {
      this.transitionToRoute('session.admin.apps.api.oauth-apps.new');
    },

    editOAuthApp(app) {
      this.transitionToRoute('session.admin.apps.api.oauth-apps.edit', app.get('id'));
    },

    deleteOAuthApp(app, e) {
      e.stopPropagation();

      return this.get('confirmation').confirm({
        intlConfirmLabel: this.get('i18n').t('admin.oauthapps.delete.button'),
        intlConfirmationBody: this.get('i18n').t('admin.oauthapps.delete.message', { name: app.get('name') }),
        isIntl: true
      }).then(() => app.destroyRecord());
    }
  }
});
