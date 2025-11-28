import Controller from '@ember/controller';
import moment from 'moment';

export default Controller.extend({
  queryParams: ['postId', 'filter'],
  filter: 'notes',
  postId: null,
  openInSameTab: false,
  transitionTabPath: null,

  actions: {
    createNewCase(userId) {
      this.transitionToRoute('session.agent.cases.new', moment().format('YYYY-MM-DD-hh-mm-ss'), { queryParams: { requester_id: userId } });
    },

    updateQueryParams(changes) {
      this.setProperties(changes);
      return true;
    },

    openInSameTab() {
      this.set('openInSameTab', true);
    }
  }
});
