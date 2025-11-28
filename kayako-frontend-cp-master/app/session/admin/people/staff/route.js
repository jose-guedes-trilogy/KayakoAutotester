import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  bulkInvitations: service(),

  model() {
    return this.store.query('user', {
      role: 'COLLABORATOR',
      limit: 9999,
      fields: 'resource_type,full_name,avatar,is_enabled,is_mfa_enabled,role(resource_type,title),teams(resource_type,title)',
      include: 'role,team'
    });
  },

  actions: {
    willTransition(transition) {
      let infos = transition.router.currentHandlerInfos;

      if (infos[infos.length - 1].name === 'session.admin.people.staff.add') {
        if (this.get('bulkInvitations.emails.length')) {
          this.store.query('user', {role: 'COLLABORATOR', limit: 9999})
            .then(users => {
              this.set('controller.model', users);
              this.get('bulkInvitations').reset();
            });
        }
      }
    },

    addTeamMembers() {
      this.transitionTo('session.admin.people.staff.add');
    }
  }
});
