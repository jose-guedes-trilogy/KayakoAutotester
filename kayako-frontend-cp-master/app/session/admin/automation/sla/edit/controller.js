import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  editComponent: null,

  // Actions
  actions: {
    cancel() {
      this.transitionToRoute('session.admin.automation.sla.index');
    },

    updated() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.transitionToRoute('session.admin.automation.sla.index');
    }
  },

  // Methods
  initEdits() {
    this.get('editComponent').initEdits();
  },

  isEdited() {
    return this.get('editComponent').isEdited();
  }
});
