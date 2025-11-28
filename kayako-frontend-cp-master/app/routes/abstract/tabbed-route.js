import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  tabStore: service(),

  setupController() {
    this._super(...arguments);
    this.controller.set('tab', this.tab);
  },

  deactivate() {
    this._super(...arguments);
  },

  // Actions
  actions: {
    subrouteDidRender(routeName) {
      if (this.tab) {
        this.get('tabStore').update(this.tab, { routeName });
      }
    }
  }
});
