import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import schema from 'frontend-cp/lib/macro-schema';
import { isEdited } from 'frontend-cp/services/virtual-model';
import MacroWrapper from 'frontend-cp/models/macro-wrapper';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  i18n: service(),
  notification: service(),
  parentRootName: 'session.admin.automation.macros.index',
  virtualModel: service(),
  store: service(),
  metrics: service(),

  // Actions
  actions: {
    created() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
      this.transitionToRoute(this.get('parentRootName'));

      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'macro_created',
          object: this.get('editedMacro.macro.id'),
          title: this.get('editedMacro.macro.title'),
          visibility_type: this.get('editedMacro.macro.visibilityType'),
        });
      }
    },

    canceled() {
      this.transitionToRoute(this.get('parentRootName'));
    }
  },

  // Methods
  isEdited() {
    return isEdited(this.get('model'), this.get('editedMacro.macro'), schema);
  },
  initEdits() {
    let macro = this.get('virtualModel').makeSnapshot(this.get('model'), schema);
    let store = this.get('store');
    this.set('editedMacro', MacroWrapper.create({ macro, store }));
  }
});
