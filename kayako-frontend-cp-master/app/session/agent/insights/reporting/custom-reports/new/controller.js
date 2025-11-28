import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

export default Controller.extend({
  schema,

  virtualModel: service(),
  notification: service('notification'),
  i18n: service(),

  initEdits() {
    this.set('editedReport', this.get('virtualModel').makeSnapshot(this.get('report'), schema));
  },

  isEdited() {
    return isEdited(this.get('report'), this.get('editedReport'), schema);
  },

  actions: {
    created() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
      this.transitionToRoute('session.agent.insights.reporting.custom-reports.index');
    },

    cancelled() {
      this.transitionToRoute('session.agent.insights.reporting.custom-reports.index');
    }
  }
});
