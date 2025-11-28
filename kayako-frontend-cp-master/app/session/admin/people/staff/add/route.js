import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import EmberObject from '@ember/object';
import Route from '@ember/routing/route';
import { getOwner } from '@ember/application';
import RSVP, { hash } from 'rsvp';
import { task } from 'ember-concurrency';
import { variation } from 'ember-launch-darkly';

import roleTypes from 'frontend-cp/lib/role-types';

export default Route.extend({
  session: service(),
  store: service(),
  permissions: service(),
  bulkInvitations: service(),
  notification: service(),
  i18n: service(),
  metrics: service(),

  activate() {
    this._super(...arguments);

    if (variation('ops-event-tracking')) {
      this.get('metrics').trackEvent({
        event: 'Team directory - Opened invite modal',
        category: 'Admin'
      });
    }
  },

  beforeModel() {
    let permissions = this.get('permissions');

    if (!permissions.has('users.update')) {
      this.transitionTo('session.admin.people.staff');
    }

    this.get('bulkInvitations').reset();
  },

  model() {
    let store = this.get('store');

    let roles = store.findAll('role')
      .then(this._filterOutCustomerRoles)
      .then(this._filterOutHigherRankedRoles.bind(this));

    let teams = store.findAll('team');
    let invitation = EmberObject.create({
      users: A([])
    });

    return hash({ invitation, roles, teams });
  },

  setupController(controller, model) {
    let invitation = model.invitation;
    let teams = model.teams;
    let roles = model.roles;

    let refData = { roles, teams };

    controller.set('model', invitation);
    controller.set('referenceData', refData);
    controller.set('saveTask', this.get('_save'));
  },

  _filterOutCustomerRoles(roles) {
    return roles.filterBy('isCollaboratorOrHigher');
  },

  _filterOutHigherRankedRoles(roles) {
    let sessionUserRoleType = this.get('session.user.role.roleType');

    let userRoleRank = roleTypes[sessionUserRoleType] && roleTypes[sessionUserRoleType].rank;
    let filteredRoles = roles.filter(role => {
      let roleType = role.get('roleType');
      let roleRank = roleTypes[roleType] && roleTypes[roleType].rank;

      return roleRank <= userRoleRank;
    });

    return RSVP.resolve(filteredRoles);
  },

  _save: task(function * (invitation) {
    let adapter = getOwner(this).lookup('adapter:application');
    let data = {
      users: invitation.get('users').map(user => {
        let obj = user.getProperties('fullname', 'email');
        obj.role_id = user.get('role.id') || null;
        obj.team_ids = user.get('teams').mapBy('id');

        return obj;
      })
    };

    invitation.get('users').forEach(user => user.set('errors', null));

    try {
      yield adapter.ajax(`${adapter.namespace}/users/invite`, 'POST', { data });

      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('admin.staff.members_invited.notification'),
        autodismiss: true
      });

      let emails = data.users.map(user => user.email);
      this.set('bulkInvitations.emails', emails);
      this.transitionTo('session.admin.people.staff');
    } catch ({ errors }) {
      let regex = /users\/(\d+)\/(\w+)/;
      errors.filter(error => error.pointer)
        .forEach(error => {
          let results = error.pointer.match(regex);
          let index = results[1];
          let field = results[2];
          let message = error.message;

          switch (field) {
            case 'role_id':
              field = 'role';
              break;
            case 'team_ids':
              field = 'teams';
              break;
          }

          let user = invitation.get('users').objectAt(index);

          if (!user.get('errors')) {
            user.set('errors', {});
          }

          if (!user.get('errors.' + field)) {
            user.set('errors.' + field, A([]));
          }

          user.get('errors.' + field).pushObject({ message });
        });
    }
  }).drop(),

  actions: {
    cancel() {
      this.transitionTo('session.admin.people.staff');
    }
  }
});
