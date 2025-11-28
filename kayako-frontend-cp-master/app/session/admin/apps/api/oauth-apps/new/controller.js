import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  virtualModel: service(),
  editedApp: null,
  isCreated: false,

  schema,

  initEdits() {
    this.set('editedApp', this.get('virtualModel').makeSnapshot(this.get('model'), schema));
  },

  isEdited() {
    return isEdited(this.get('model'), this.get('editedApp'), schema) && !this.get('isCreated');
  },

  actions: {
    created() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });
      this.set('isCreated', true);
    },

    done() {
      this.transitionToRoute('session.admin.apps.api.oauth-apps.index');
    },

    canceled() {
      this.transitionToRoute('session.admin.apps.api.oauth-apps.index');
    }
  }
});
