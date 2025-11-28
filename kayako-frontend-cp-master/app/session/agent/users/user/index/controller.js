import Controller from '@ember/controller';
import moment from 'moment';

export default Controller.extend({
  queryParams: ['timestamp'],
  timestamp: null,

  actions: {
    updateQueryParams(changes) {
      this.setProperties(changes);
      return true;
    },

    createNewCase(userId) {
      this.transitionToRoute('session.agent.cases.new', moment().format('YYYY-MM-DD-hh-mm-ss'), { queryParams: { requester_id: userId } });
    }
  }
});
