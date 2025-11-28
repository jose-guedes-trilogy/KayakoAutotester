import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

import { variation } from 'ember-launch-darkly';

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
  metrics: service(),

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

      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'email_created',
          object: this.get('editedMailbox.brand.id'),
          brand: this.get('editedMailbox.brand.domain'),
          email: this.get('editedMailbox.address')
        });
      }

      this.transitionToRoute('session.admin.channels.email.index');
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
