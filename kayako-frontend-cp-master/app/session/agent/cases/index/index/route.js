import Route from '@ember/routing/route';

export default Route.extend({
  beforeModel() {
    // Redirect to the first view.
    const views = this.modelFor('session.agent.cases.index').views;
    const inbox = views.findBy('isDefault');
    this.transitionTo('session.agent.cases.index.view', inbox.id);
  }
});
