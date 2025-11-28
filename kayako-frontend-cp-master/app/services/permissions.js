import Service, { inject as service } from '@ember/service';
import roleTypes from 'frontend-cp/lib/role-types';
import { get } from '@ember/object';

let adminOrAgentToCustomer = function(roleType, targetRoleType) {
  if (roleType.rank === roleTypes.AGENT.rank) {
    return roleTypes.CUSTOMER.rank === targetRoleType.rank;
  }

  return roleType.rank >= roleTypes.ADMIN.rank;
};

/*
 * A map of system actions to a function that checks if the roleType provided
 * has the ability to carry out this action.
 * The actions should match values in `permissions` list for a given roleType
 *
 * The 1st argument of the function will always be the roleType of the current
 * logged in user. Any other arguments passed to the helper are provided as
 * a list.
 *
 * The function allows us to perform additional checks on top of the existence
 * of the permission e.g. 'app.delete.user' requires that the roleType.rank of
 * the logged in user be greater than that of the user they are trying to
 * delete.
 */
let applicationActions = {
  'app.user.signature.edit'(myRoleType, me, target) {

    // I can change my own signature or anyone's if I am an Owner
    return target && me === target || me.get('role.roleType') === 'OWNER';
  },
  // ADMIN can disable all, AGENT only CUSTOMER
  'app.user.disable'(roleType, subject, user) {
    let userRoleType = user.get('role.roleType');

    // I cannot disable myself!
    if (subject && user && subject === user) {
      return false;
    }
    return adminOrAgentToCustomer(roleType, roleTypes[userRoleType]);
  },
  'app.user.password.change'(roleType, user, target) {
    // I can change my own password:
    if (user && target && user === target) {
      return true;
    }

    let userRoleType = user.get('role.roleType');
    return adminOrAgentToCustomer(roleType, userRoleType) && target.get('emails').toArray().length;
  },
  'app.organization.delete'(roleType, user, organization) {
    return roleType.rank >= roleTypes.AGENT.rank;
  },
  'app.user.change_agent_access_permission'(myRoleType, me, targetUser) {
    return targetUser.get('role.roleType') !== 'CUSTOMER' && myRoleType.rank >= roleTypes.ADMIN.rank;
  },
  'app.user.change_organization_access_permission'(myRoleType, me, targetUser) {
    return targetUser.get('role.roleType') === 'CUSTOMER' && myRoleType.rank >= roleTypes.ADMIN.rank;
  },
  'app.user.change_team_permission'(myRoleType, me, targetUser) {
    return targetUser.get('role.roleType') !== 'CUSTOMER' && myRoleType.rank >= roleTypes.ADMIN.rank;
  },
  'app.user.view_team_permission'(myRoleType, me, targetUser) {
    return targetUser.get('role.roleType') !== 'CUSTOMER' && myRoleType.rank >= roleTypes.COLLABORATOR.rank;
  },
  'app.user.change_role_permission'(myRoleType, me, target) {
    // Cannot change myself
    if (me === target || get(target, 'isDeleted')) {
      return false;
    }
    return myRoleType.rank >= roleTypes.ADMIN.rank && myRoleType.rank >= roleTypes[target.get('role.roleType')].rank;
  },
  'app.admin.access'(myRoleType) {
    return myRoleType.rank >= roleTypes.ADMIN.rank;
  },
  'app.user.post_private_note'() {
    return true;
  },
  'app.organization.post_private_note'() {
    return true;
  }
};

export default Service.extend({
  sessionService: service('session'),
  notificationService: service('notification'),
  i18n: service(),
  notificationHandler: service('error-handler/notification-strategy'),

  showError() {
    this.get('notificationHandler').processAll([{
      type: 'error',
      message: this.get('i18n').t('generic.permissions_denied'),
      sticky: false
    }]);
  },

  has(action, target) {
    let role = this.get('sessionService.user.role');
    let subjectRoleType = roleTypes[role.get('roleType')];
    let permissions = this.get('sessionService.permissions');

    // First check the permission exists
    if (subjectRoleType && subjectRoleType.permissions.indexOf(action) > -1) {
      // Then allow the permission function to run
      return applicationActions[action](subjectRoleType, this.get('sessionService.user'), target);
    }

    const roleRegex = new RegExp('(customer|collaborator|agent|admin|owner).', 'i');

    // Check role permissions
    return permissions
        .filter(perm => {
          // this is required as we want to compare only real permission name
          // excluding role type in the beginning of the string
          let permissionName = perm.get('name').replace(roleRegex, '');
          let actionName = action.replace(roleRegex, '');
          return permissionName === actionName && perm.get('value');
        }).length > 0;
  }
});
