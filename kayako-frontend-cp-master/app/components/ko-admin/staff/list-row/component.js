import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  //attributes
  user: null,
  list: null,

  // Services
  tabStore: service(),
  router: service(),

  // CPs
  teamList: computed('user.teams.[]', function() {
    return this.get('user.teams').map(team => team.get('title')).join(', ');
  }),

  actions: {
    viewUser(user, event) {
      const router = this.get('router');
      const route = 'session.agent.users.user';
      const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey;

      if (hasModifier) {
        this.get('tabStore').createTab(route, user);
      } else {
        router.transitionTo(route, user.get('id'));
      }
    }
  }
});
