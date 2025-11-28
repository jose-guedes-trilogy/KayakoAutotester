import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import schema from '../schema';
import { isEdited } from 'frontend-cp/services/virtual-model';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  virtualModel: service(),
  editedPage: null,
  page: null,

  // Actions
  actions: {
    cancel() {
      this.transitionToRoute('session.admin.channels.facebook.index');
    },

    save() {
      const virtualModel = this.get('virtualModel');
      const page = this.get('page');
      const editedPage = this.get('editedPage');

      return virtualModel
        .save(page, editedPage, schema)
        .then(snapshot => this.set('editedPage', snapshot));
    },

    onSuccess() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.transitionToRoute('session.admin.channels.facebook.index');
    }
  },

  // Methods
  initEdits() {
    this.set('editedPage', this.get('virtualModel').makeSnapshot(this.get('page'), schema));
  },

  isEdited() {
    return isEdited(this.get('page'), this.get('editedPage'), schema);
  }
});
