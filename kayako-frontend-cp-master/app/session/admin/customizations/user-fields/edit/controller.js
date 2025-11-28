import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from 'frontend-cp/lib/fields-schema';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  customFields: service(),
  virtualModel: service(),
  schema,

  // CPs
  title: computed('field.title', function() {
    return this.get('customFields').getTitleBreadcrumbs(this.get('field'));
  }),

  // Actions
  actions: {
    updated() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
      this.transitionToRoute('session.admin.customizations.user-fields.index');
    },

    deleted() {
      this.initEdits();
      this.transitionToRoute('session.admin.customizations.user-fields.index');
    },

    canceled() {
      this.transitionToRoute('session.admin.customizations.user-fields.index');
    }
  },

  // Methods
  initEdits() {
    this.set('editedField', this.get('virtualModel').makeSnapshot(this.get('field'), schema));
  },

  isEdited() {
    return isEdited(this.get('field'), this.get('editedField'), schema);
  }
});
