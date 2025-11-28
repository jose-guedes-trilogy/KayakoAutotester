import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import moment from 'moment';

export default Controller.extend({
  tabStore: service('tab-store'),
  queryParams: ['timestamp'],
  timestamp: null,

  actions: {
    updateQueryParams(changes) {
      this.setProperties(changes);
      return true;
    },

    createNewCase(userId) {
      this.get('tabStore').transitionAndInsertTabNextToActiveTab('session.agent.cases.new', [moment().format('YYYY-MM-DD-hh-mm-ss')], { queryParams: { requester_id: userId } });
    }
  }
});
