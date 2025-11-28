import TabbedRoute from 'frontend-cp/routes/abstract/tabbed-route';
import { inject as service } from '@ember/service';
import { getOwner } from '@ember/application';

export default TabbedRoute.extend({
  i18n: service(),
  socket: service(),
  processManager: service(),

  model(params) {
    return this.store.findRecord('case', params.case_id, { reload: true }) // AI-GEN - Cursor and GPT4
      .then(kase => kase.hasMany('tags').reload().then(() => kase)); // AI-GEN - Cursor and GPT4
  },

  afterModel(model, transition) {
    let processManager = this.get('processManager');
    let process = processManager.getOrCreateProcess(model, 'case');
    processManager.setForegroundProcess(process);

    let tabStore = this.get('tabStore');
    let tab = tabStore.open(transition);

    tabStore.update(tab, { process });
    this.set('tab', tab);
    
    const previousState = process.get('state');
    
    const CaseStateManager = getOwner(this).factoryFor('state-manager:case'); // AI-GEN - Cursor and GPT4
    const state = CaseStateManager.create({model, tab}); // AI-GEN - Cursor and GPT4
    
    if (previousState && previousState.postContent) {
      state.set('postContent', previousState.postContent);
    }

    process.set('state', state); // AI-GEN - Cursor and GPT4\
    this.set('state', state);

    this._super(...arguments);
  },

  setupController(controller, model) {
    this._super(...arguments);
    controller.set('state', this.get('state'));
  },

  actions: {
    willTransition() {
      let processManager = this.get('processManager');
      processManager.setForegroundProcess(null);

      this._super(...arguments);
    }
  }
});
