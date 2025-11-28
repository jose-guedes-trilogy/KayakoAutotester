import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',

  // Attributes
  action: null,
  statusId: null,

  // Services
  store: service(),

  // Functions
  caseStatusType: function (statusId) {
    return this.get('store').peekRecord('case-status', statusId).get('statusType');
  }
});
