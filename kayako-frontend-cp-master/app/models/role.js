import { computed } from '@ember/object';
import DS from 'ember-data';
import roleTypes from 'frontend-cp/lib/role-types';

export default DS.Model.extend({
  title: DS.attr('string'),
  roleType: DS.attr('string', { defaultValue: 'AGENT' }),
  agentCaseAccess: DS.attr('string', { defaultValue: 'ALL' }),
  isSystem: DS.attr('boolean'),
  permissions: DS.hasMany('permission', { async: true }),

  isAdminOrHigher: computed('roleType', function () {
    let roleType = this.get('roleType');

    return roleTypes[roleType].rank >= roleTypes.ADMIN.rank;
  }),

  isAgentOrHigher: computed('roleType', function () {
    let roleType = this.get('roleType');

    return roleTypes[roleType].rank >= roleTypes.AGENT.rank;
  }),

  isCollaboratorOrHigher: computed('roleType', function () {
    let roleType = this.get('roleType');

    return roleTypes[roleType].rank >= roleTypes.COLLABORATOR.rank;
  })
});
