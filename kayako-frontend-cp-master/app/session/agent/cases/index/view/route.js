import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  caseListTab: service(),
  tabStore: service(),

  model({ view_id }) {
    let model = this.modelFor('session.agent.cases.index').views.findBy('id', view_id);
    if (!model || !model.get('isEnabled')) {
      // isEnabled can be false if we move from view -> admin -> disable view
      // come back
      this.transitionTo('session.agent.cases.index');
    }
    return model;
  },

  afterModel() {
    // We just want to kick this request off in the background so no need to return the promise;
    this.get('caseListTab').updateViewCounts();
  },

  setupController(controller, model) {
    this._super(...arguments);
    this.get('tabStore').setCasesViewId(model.get('id'));
  }
});
