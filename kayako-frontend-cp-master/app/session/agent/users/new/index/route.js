import TabbedRouteChild from 'frontend-cp/routes/abstract/tabbed-route-child';

export default TabbedRouteChild.extend({
  queryParams: {
    postId: { replace: true },
    filter: { replace: true }
  },

  setupController(controller, model) {
    this._super(...arguments);
    let parentController = this.controllerFor('session.agent.users.new');
    controller.set('state', parentController.get('state'));
  }
});
