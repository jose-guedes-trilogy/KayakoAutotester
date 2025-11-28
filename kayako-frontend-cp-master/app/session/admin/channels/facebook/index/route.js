import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return this.store.query('facebook-page', { state: 'IMPORTED' });
  },

  actions: {
    showModal(flag = false) {
      this.transitionTo('session.admin.channels.facebook.index', { queryParams: { showModal: flag } });
    },

    editPage(page) {
      this.transitionTo('session.admin.channels.facebook.edit', page.get('id'));
    }
  }
});
