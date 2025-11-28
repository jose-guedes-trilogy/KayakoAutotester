import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  tabStore: service('tab-store'),

  actions: {
    openCase(feedbackCase, e) {
      e.preventDefault();
      e.stopPropagation();
      this.get('tabStore').transitionAndInsertTabNextToActiveTab('session.agent.cases.case', [feedbackCase]);
    }
  }
});
