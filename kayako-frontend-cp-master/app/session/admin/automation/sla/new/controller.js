import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  editComponent: null,
  metrics: service(),

  // Actions
  actions: {
    cancel() {
      this.transitionToRoute('session.admin.automation.sla.index');
    },

    created() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'sla_created',
        });
      }

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
