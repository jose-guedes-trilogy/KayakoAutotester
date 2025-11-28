import TabbedRoute from 'frontend-cp/routes/abstract/tabbed-route';

export default TabbedRoute.extend({
  model() {
    return {};
  },

  afterModel(_, transition) {
    this.tab = this.get('tabStore').open(transition, 'Test');
  }
});
