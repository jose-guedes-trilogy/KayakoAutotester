import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import schema from '../schema';
import { isEdited } from 'frontend-cp/services/virtual-model';

import { variation } from 'ember-launch-darkly';

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
  metrics: service(),

  schema,

  initEdits() {
    this.set('editedTeam', this.get('virtualModel').makeSnapshot(this.get('team'), schema));
  },

  isEdited() {
    return isEdited(this.get('team'), this.get('editedTeam'), schema);
  },

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
          event: 'team_created',
          name: this.get('editedTeam.title')
        });
      }
      this.transitionToRoute('session.admin.people.teams.index');
    },

    redirectToIndex() {
      this.transitionToRoute('session.admin.people.teams.index');
    }
  }
});
