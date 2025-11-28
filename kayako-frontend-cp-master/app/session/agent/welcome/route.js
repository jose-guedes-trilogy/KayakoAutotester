import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { resolve, hash } from 'rsvp';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import roleTypes from 'frontend-cp/lib/role-types';

export default Route.extend({
  session: service(),
  notification: service('notification'),
  i18n: service(),

  queryParams: {
    code: { refreshModel: true },
    state: { refreshModel: true },
    oauth_token: { refreshModel: true },
    oauth_verifier: { refreshModel: true }
  },

  _filterOutCustomerRoles(roles) {
    return roles.filterBy('isCollaboratorOrHigher');
  },

  _filterOutHigherRankedRoles(roles) {
    const sessionUserRoleType = this.get('session.user.role.roleType');
    const userRoleRank = roleTypes[sessionUserRoleType] && roleTypes[sessionUserRoleType].rank;

    const filteredRoles = roles.filter(role => {
      const roleType = role.get('roleType');
      const roleRank = roleTypes[roleType] && roleTypes[roleType].rank;
      return roleRank <= userRoleRank;
    });

    return resolve(filteredRoles);
  },

  model(params, transition) {
    const store = this.get('store');

    const roles = store.findAll('role')
      .then(this._filterOutCustomerRoles.bind(this))
      .then(this._filterOutHigherRankedRoles.bind(this));
    const teams = store.findAll('team');
    const invitation = EmberObject.create({
      users: A([])
    });
    const brand = store.findAll('brand');
    const settings = store.findAll('setting');
    const twitterAccount = store.findAll('twitterAccount');
    const facebookPage = store.findAll('facebookPage');
    const agentMetrics = store.queryRecord('conversation-starter', {});
    const isRedirected = transition.queryParams.trial;

    return hash({
      invitation,
      roles,
      teams,
      brand,
      settings,
      twitterAccount,
      facebookPage,
      agentMetrics,
      params,
      isRedirected
    });
  }
});
