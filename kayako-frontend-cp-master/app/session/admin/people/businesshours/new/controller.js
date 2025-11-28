import Controller from '@ember/controller';
import { isEdited } from 'frontend-cp/services/virtual-model';
import { inject as service } from '@ember/service';
import schema from '../schema';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  // Services
  notification: service(),
  i18n: service(),
  virtualModel: service(),
  metrics: service(),

  schema,

  // Methods
  initEdits() {
    this.set('editedBusinessHour', this.get('virtualModel').makeSnapshot(this.get('businessHour'), schema));
  },

  isEdited() {
    return isEdited(this.get('businessHour'), this.get('editedBusinessHour'), schema);
  },

  // Actions
  actions: {
    created() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'business_hours_created',
          object: this.get('editedBusinessHour.id')
        });
      }
      this.transitionToRoute('session.admin.people.businesshours.index');
    },

    canceled() {
      this.transitionToRoute('session.admin.people.businesshours.index');
    }
  }
});
