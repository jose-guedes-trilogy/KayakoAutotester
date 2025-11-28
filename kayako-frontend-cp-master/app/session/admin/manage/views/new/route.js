import Route from '@ember/routing/route';
import DirtyAwareRoute from 'frontend-cp/mixins/dirty-aware/route';
import { variation } from 'ember-launch-darkly';

export default Route.extend(DirtyAwareRoute('caseView'), {
  model() {
    let newView = this.store.createRecord('view');
    /* Setup defaults and recache the relationships */
    let firstProposition = this.store.createRecord('proposition', {});

    newView.get('predicateCollections').createRecord({
      propositions: [firstProposition]
    });

    return this.store.findAll('column').then((columns) => {
      let defaults = ['caseid', 'subject', 'casestatusid', 'assigneeagentid', 'updatedat', 'requesterid'];
      if (variation('release-refactor-columns-new-view')) {
        defaults = ['casestatusid', 'assigneeagentid', 'createdat', 'updatedat'];
      }
      let filtered = columns.filter((column) => defaults.indexOf(column.get('id')) > -1);
      newView.get('columns').pushObjects(filtered);
      return newView;
    });
  },

  setupController(controller, caseView) {
    controller.setProperties({ caseView });
    controller.initEdits();
  }
});
