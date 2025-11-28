import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import schema from '../schema';
import { isEdited } from 'frontend-cp/services/virtual-model';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  virtualModel: service(),

  editedAccount: null,
  account: null,

  // Actions
  actions: {
    cancel() {
      this.transitionToRoute('session.admin.channels.twitter.index');
    },

    save() {
      const virtualModel = this.get('virtualModel');
      const account = this.get('account');
      const editedAccount = this.get('editedAccount');

      return virtualModel
        .save(account, editedAccount, schema)
        .then(snapshot => this.set('editedAccount', snapshot));
    },

    onSuccess() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.transitionToRoute('session.admin.channels.twitter.index');
    }
  },

  // Methods
  initEdits() {
    this.set('editedAccount', this.get('virtualModel').makeSnapshot(this.get('account'), schema));
  },

  isEdited() {
    return isEdited(this.get('account'), this.get('editedAccount'), schema);
  }
});
