import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  endpoints: service(),
  virtualModel: service(),

  schema,

  // Methods
  initEdits() {
    this.set('editedPrivacy', this.get('virtualModel').makeSnapshot(this.get('privacy'), schema));
  },

  isEdited() {
    return isEdited(this.get('privacy'), this.get('editedPrivacy'), schema);
  },

  // Actions
  actions: {
    updated() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
      this.transitionToRoute('session.admin.customizations.privacy.index');
    },

    deleted() {
      this.initEdits();
      this.transitionToRoute('session.admin.customizations.privacy.index');
    },

    canceled() {
      this.transitionToRoute('session.admin.customizations.privacy.index');
    }
  }
});
