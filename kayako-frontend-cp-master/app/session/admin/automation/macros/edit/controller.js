import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import schema from 'frontend-cp/lib/macro-schema';
import { isEdited } from 'frontend-cp/services/virtual-model';
import MacroWrapper from 'frontend-cp/models/macro-wrapper';

export default Controller.extend({
  i18n: service(),
  notification: service(),
  parentRootName: 'session.admin.automation.macros.index',
  virtualModel: service(),
  store: service(),

  // Actions
  actions: {
    updated() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
      this.transitionToRoute(this.get('parentRootName'));
    },

    canceled() {
      this.transitionToRoute(this.get('parentRootName'));
    }
  },

  isEdited() {
    return isEdited(this.get('model'), this.get('editedMacro.macro'), schema);
  },
  initEdits() {
    let macro = this.get('virtualModel').makeSnapshot(this.get('model'), schema);
    let store = this.get('store');
    this.set('editedMacro', MacroWrapper.create({ macro, store }));
  }
});
