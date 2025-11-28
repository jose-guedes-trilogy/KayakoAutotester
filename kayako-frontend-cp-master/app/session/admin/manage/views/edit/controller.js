import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  virtualModel: service(),
  caseListTab: service('case-list-tab'),

  schema,

  initEdits() {
    this.set('editedCaseView', this.get('virtualModel').makeSnapshot(this.get('caseView'), schema));
  },

  isEdited() {
    return isEdited(this.get('caseView'), this.get('editedCaseView'), schema);
  },

  actions: {
    updated() {
      this.get('notification').success(this.get('i18n').t('generic.changes_saved'));
      
      this.get('caseListTab').set('forceNextLoad', true);
      this.initEdits();
      this.transitionToRoute('session.admin.manage.views.index');
    },

    deleted() {
      this.get('caseListTab').set('forceNextLoad', true);
      this.initEdits();
      this.transitionToRoute('session.admin.manage.views.index');
    },

    redirectToIndex() {
      this.transitionToRoute('session.admin.manage.views.index');
    }
  }
});
