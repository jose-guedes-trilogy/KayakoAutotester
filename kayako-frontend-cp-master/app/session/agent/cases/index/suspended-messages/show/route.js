import Route from '@ember/routing/route';

export default Route.extend({
  model({ id }) {
    return this.modelFor('session.agent.cases.index.suspended-messages').findBy('id', id);
  },

  actions: {
    permanentlyDelete() {
      this.modelFor(this.routeName).destroyRecord().
        then(() => this.transitionTo('session.agent.cases.index.suspended-messages'));
    },

    allowThrough() {
      const mail = this.modelFor(this.routeName);
      mail.set('isSuspended', false);
      mail.save().then(() => this.transitionTo('session.agent.cases.index.suspended-messages'));
    },

    onClose() {
      this.transitionTo('session.agent.cases.index.suspended-messages.index');
    }
  }
});
