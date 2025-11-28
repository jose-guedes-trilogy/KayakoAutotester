import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

export default Controller.extend({
  notification: service(),
  confirmation: service(),
  i18n: service(),
  virtualModel: service(),
  editedApp: null,

  schema,

  initEdits() {
    this.set('editedApp', this.get('virtualModel').makeSnapshot(this.get('model'), schema));
  },

  isEdited() {
    return isEdited(this.get('model'), this.get('editedApp'), schema);
  },

  actions: {
    updated() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });
      this.initEdits();
      this.transitionToRoute('session.admin.apps.api.oauth-apps.index');
    },

    canceled() {
      this.transitionToRoute('session.admin.apps.api.oauth-apps.index');
    },

    deleted() {
      return this.get('confirmation').confirm({
        intlConfirmLabel: this.get('i18n').t('admin.oauthapps.delete.button'),
        intlConfirmationBody: this.get('i18n').t('admin.oauthapps.delete.message', { name: this.get('model.name') }),
        isIntl: true
      }).then(() => {
        this.get('model').destroyRecord().then(() => {
          this.transitionToRoute('session.admin.apps.api.oauth-apps.index');
        });
      });
    }
  }
});
