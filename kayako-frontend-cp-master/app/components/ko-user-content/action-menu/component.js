import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { readOnly, equal, not, bool } from '@ember/object/computed';
import ROLE_TYPES from 'frontend-cp/lib/role-types';

export default Component.extend({
  // Attributes
  user: null,
  filter: null,
  canModifyUserState: false,
  showManageAppAccess: false,
  onCreateNewCase: null,
  onManageAppAccess: null,
  onEditSignature: null,
  onEnableTwoFactor: null,
  onDisableTwoFactor: null,
  onChangeUserPassword: null,
  onSetFilter: () => {},
  onUserToggle: () => {},
  deleteUser: () => {},

  // Services
  permissions: service(),
  session: service(),

  // CPs
  currentUser: readOnly('session.user'),
  sessionPermissions: readOnly('session.permissions'),
  isDisabled: not('user.isEnabled'),
  targetUserIsCustomer: equal('user.role.roleType', 'CUSTOMER'),
  currentUserIsAdminOrHigher: bool('currentUser.role.isAdminOrHigher'),

  hasTwoFactorAuth: readOnly('user.isMfaEnabled'),

  targetUserIsCurrentUser: computed('user', function () {
    return this.get('user') === this.get('session.user');
  }),

  canDeleteTargetUser: computed(
    'currentUser.role.roleType',
    'currentUser.role.permissions.@each.value',
    'user.role.roleType',
  function() {
    let currentUser = this.get('currentUser');
    let targetUser = this.get('user');

    if (targetUser === currentUser) {
      return false;
    }

    let currentUserRoleType = currentUser.get('role.roleType');
    let targetUserRoleType = targetUser.get('role.roleType');

    switch (currentUserRoleType) {
      case 'OWNER':
      case 'ADMIN':
        let currentUserRoleRank = ROLE_TYPES[currentUserRoleType].rank;
        let targetUserRoleRank = ROLE_TYPES[targetUserRoleType].rank;

        return currentUserRoleRank >= targetUserRoleRank;
      case 'AGENT':
        if (targetUserRoleType !== 'CUSTOMER') {
          return false;
        }

        let permissions = this.get('currentUser.role.permissions') || [];
        let permission = permissions.findBy('name', 'users.delete');
        let hasPermission = permission && permission.get('value');

        return !!hasPermission;
      default:
        return false;
    }
  }),

  currentUserHasChangeSignaturePermission: computed('sessionPermissions', 'currentUser.role.roleType', function () {
    return this.get('permissions').has('app.user.signature.edit', this.get('user'));
  }),

  currentUserHasChangePasswordEmailPermission: computed('sessionPermissions', 'currentUser.role.roleType', function () {
    return this.get('permissions').has('app.user.password.change', this.get('user'));
  }),

  hasDisableTwoFactorPermission: equal('currentUser.role.roleType', 'OWNER')
});
