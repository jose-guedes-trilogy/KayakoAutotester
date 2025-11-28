import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  endpoints: service(),
  virtualModel: service(),

  schema,

  // CPs
  title: computed('endpoint', function() {
    return this.get('endpoints').getTitleBreadcrumbs(this.get('endpoint'));
  }),

  // Methods
  initEdits() {
    this.set('editedEndpoint', this.get('virtualModel').makeSnapshot(this.get('endpoint'), schema));
  },

  isEdited() {
    return isEdited(this.get('endpoint'), this.get('editedEndpoint'), schema);
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
      this.transitionToRoute('session.admin.apps.endpoints.index');
    },

    deleted() {
      this.initEdits();
      this.transitionToRoute('session.admin.apps.endpoints.index');
    },

    canceled() {
      this.transitionToRoute('session.admin.apps.endpoints.index');
    }
  }
});
