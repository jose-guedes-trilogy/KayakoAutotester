let roleTypes = {
  OWNER: {
    rank: 5,
    permissions: []
  },
  ADMIN: {
    rank: 4,
    permissions: []
  },
  AGENT: {
    rank: 3,
    permissions: []
  },
  COLLABORATOR: {
    rank: 2,
    permissions: []
  },
  CUSTOMER: {
    rank: 1,
    permissions: []
  }
};

/**
 * Assign the appropriate actions to each users `permissions` list.
 * permissions Cascade so an AGENT = CUSTOMER + COLLABORATOR + AGENT
 */
roleTypes.CUSTOMER.permissions = [];

roleTypes.COLLABORATOR.permissions = roleTypes.CUSTOMER.permissions.concat([
  'app.user.view_team_permission',
  'app.user.post_private_note',
  'app.organization.post_private_note'
]);

roleTypes.AGENT.permissions = roleTypes.COLLABORATOR.permissions.concat([
  'app.user.disable',
  'app.user.signature.edit',
  'app.user.password.change',
  'app.organization.delete'
]);

roleTypes.ADMIN.permissions = roleTypes.AGENT.permissions.concat([
  'app.user.delete',
  'app.user.change_agent_access_permission',
  'app.user.change_organization_access_permission',
  'app.user.change_team_permission',
  'app.user.change_role_permission',
  'app.admin.access'
]);

roleTypes.OWNER.permissions = roleTypes.ADMIN.permissions.concat([
]);

export default roleTypes;
