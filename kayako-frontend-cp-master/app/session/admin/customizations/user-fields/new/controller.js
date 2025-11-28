import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from 'frontend-cp/lib/fields-schema';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  customFields: service(),
  virtualModel: service(),
  metrics: service(),

  schema,

  initEdits() {
    this.set('editedField', this.get('virtualModel').makeSnapshot(this.get('field'), schema));
  },

  isEdited() {
    return isEdited(this.get('field'), this.get('editedField'), schema);
  },

  title: computed('field.title', function() {
    return this.get('customFields').getTitleBreadcrumbs(this.get('field'));
  }),

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
          event: 'organization_field_created',
          object: this.get('editedField.id'),
          type: this.get('editedField.fieldType'),
        });
      }
      this.transitionToRoute('session.admin.customizations.user-fields.index');
    },

    canceled() {
      this.transitionToRoute('session.admin.customizations.user-fields.index');
    }
  }
});
