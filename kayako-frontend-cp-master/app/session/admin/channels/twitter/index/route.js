import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return this.store.findAll('twitter-account', {reload: true});
  },

  actions: {
    editAccount(account) {
      this.transitionTo('session.admin.channels.twitter.edit', account.get('id'));
    }
  }
});
