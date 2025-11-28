import Controller from '@ember/controller';
import { inject as controller } from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  queryParams: ['page', 'orderBy', 'orderByColumn'],
  page: 1,

  // State
  parentController: controller('session.agent.cases.index'),
  selectedCaseIds: computed.readOnly('parentController.selectedCaseIds'),

  // Actions
  actions: {
    sortCases(orderBy, orderByColumn) {
      this.setProperties({
        orderBy, orderByColumn
      });
    },

    setSelectedCaseIds(checkedRows) {
      this.get('parentController').send('setSelectedCaseIds', checkedRows);
    }
  }
});
