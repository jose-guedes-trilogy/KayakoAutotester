import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  notification: service(),
  i18n: service(),

  actions: {
    installed(installedApp) {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('admin.apps.manage.notifications.installed_app'),
        autodismiss: true
      });

      this.transitionToRoute('session.admin.apps.manage.edit', installedApp.get('id'));
    }
  }
});
