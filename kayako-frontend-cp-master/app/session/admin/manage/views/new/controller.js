import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  notification: service(),
  i18n: service(),
  virtualModel: service(),
  caseListTab: service('case-list-tab'),
  metrics: service(),

  schema,

  initEdits() {
    this.set('editedCaseView', this.get('virtualModel').makeSnapshot(this.get('caseView'), schema));
  },

  isEdited() {
    return isEdited(this.get('caseView'), this.get('editedCaseView'), schema);
  },

  actions: {
    saved() {
      this.get('notification').success(this.get('i18n').t('generic.changes_saved'));

      this.get('caseListTab').set('forceNextLoad', true);
      this.initEdits();
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'view_created',
          object: this.get('editedCaseView.id')
        });
      }
      this.transitionToRoute('session.admin.manage.views.index');
    },

    redirectToIndex() {
      this.transitionToRoute('session.admin.manage.views.index');
    }
  }
});
