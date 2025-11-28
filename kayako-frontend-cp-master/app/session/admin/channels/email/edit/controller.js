import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

export default Controller.extend({
  // Attributes
  mailbox: null,
  brands: [],
  editedMailbox: null,
  schema,

  // Services
  notification: service(),
  i18n: service(),
  virtualModel: service(),

  // Actions
  actions: {
    cancel() {
      this.transitionToRoute('session.admin.channels.email.index');
    },

    edit(editedMailbox) {
      this.set('editedMailbox', editedMailbox);
    },

    onSuccess() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.transitionToRoute('session.admin.channels.email.index');
    },

    onError() {

    }
  },

  // Methods
  initEdits() {
    this.set('editedMailbox', this.get('virtualModel').makeSnapshot(this.get('mailbox'), schema));
  },

  isEdited() {
    return isEdited(this.get('mailbox'), this.get('editedMailbox'), schema);
  }
});
