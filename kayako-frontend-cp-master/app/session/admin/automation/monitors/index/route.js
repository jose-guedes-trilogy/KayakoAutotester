import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return this.store.findAll('monitor', {reload: true});
  },

  // Actions
  actions: {
    edit(monitor) {
      return this.transitionTo('session.admin.automation.monitors.edit', monitor);
    }
  }
});
