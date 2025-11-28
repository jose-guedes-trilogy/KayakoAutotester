import TabbedRouteChild from 'frontend-cp/routes/abstract/tabbed-route-child';

export default TabbedRouteChild.extend({
  setupController(controller, model) {
    this._super(...arguments);
    let parentController = this.controllerFor('session.agent.organizations.new');
    controller.set('state', parentController.get('state'));
  }
});
