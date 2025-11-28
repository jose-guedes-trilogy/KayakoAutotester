import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

export default Controller.extend({
  // Attributes
  businessHours: null,
  team: null,

  // State
  editedTeam: null,

  // Services
  i18n: service(),
  notification: service(),
  virtualModel: service(),

  schema,

  initEdits() {
    this.set('editedTeam', this.get('virtualModel').makeSnapshot(this.get('team'), schema));
  },

  isEdited() {
    return isEdited(this.get('team'), this.get('editedTeam'), schema);
  },

  actions: {
    updated() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
      this.transitionToRoute('session.admin.people.teams.index');
    },

    deleted() {
      this.initEdits();
      this.transitionToRoute('session.admin.people.teams.index');
    },

    redirectToIndex() {
      this.transitionToRoute('session.admin.people.teams.index');
    }
  }
});
