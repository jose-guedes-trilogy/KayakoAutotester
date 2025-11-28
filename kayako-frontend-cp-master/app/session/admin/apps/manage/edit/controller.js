import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  notification: service(),
  i18n: service(),

  actions: {
    updated() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.transitionToRoute('session.admin.apps.manage.index');
    },

    uninstalled() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('admin.apps.manage.notifications.uninstalled_app'),
        autodismiss: true
      });

      this.transitionToRoute('session.admin.apps.manage.index');
    },

    cancelled() {
      this.transitionToRoute('session.admin.apps.manage.index');
    }
  }
});
