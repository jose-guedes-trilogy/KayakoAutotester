import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import schema from '../schema';
import { isEdited } from 'frontend-cp/services/virtual-model';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  virtualModel: service(),

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
    updated() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
      this.transitionToRoute('session.admin.people.businesshours.index');
    },

    deleted() {
      this.initEdits();
      this.transitionToRoute('session.admin.apps.endpoints.index');
    },

    canceled() {
      this.transitionToRoute('session.admin.people.businesshours.index');
    }
  }
});
