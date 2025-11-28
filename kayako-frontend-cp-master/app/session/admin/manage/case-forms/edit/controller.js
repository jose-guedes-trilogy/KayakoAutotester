import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { isEdited } from 'frontend-cp/services/virtual-model';
import schema from '../schema';

import { variation } from 'ember-launch-darkly';

export default Controller.extend({
  notification: service('notification'),
  i18n: service(),
  virtualModel: service(),
  metrics: service(),

  schema,

  initEdits() {
    this.set('editedCaseForm', this.get('virtualModel').makeSnapshot(this.get('caseForm'), schema));
  },

  isEdited() {
    return isEdited(this.get('caseForm'), this.get('editedCaseForm'), schema);
  },

  actions: {
    updated() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      this.initEdits();
      this.transitionToRoute('session.admin.manage.case-forms.index');
    },

    deleted(formId) {
      this.initEdits();
      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'form_deleted',
          object: formId
        });
      }
      this.transitionToRoute('session.admin.manage.case-forms.index');
    },

    redirectToIndex() {
      this.transitionToRoute('session.admin.manage.case-forms.index');
    }
  }
});
