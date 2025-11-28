import { inject as service } from '@ember/service';
import { readOnly } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
  showingViewsList: true,
  views: null,
  teams: null,
  customViews: null,

  caseListTab: service('case-list-tab'),

  inboxView: readOnly('caseListTab.inboxView'),

  actions: {
    clearSelectedCaseIds() {
      this.send('setSelectedCaseIds', []);
    },

    bulkUpdateComplete() {
      this.send('setSelectedCaseIds', []);
      this.send('refreshCaseList');
    },

    setSelectedCaseIds(checkedRows) {
      this.set('selectedCaseIds', checkedRows || []);
    }
  }
});
