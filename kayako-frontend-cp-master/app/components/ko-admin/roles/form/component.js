import { inject as service } from '@ember/service';
import { readOnly, filterBy } from '@ember/object/computed';
import { on } from '@ember/object/evented';
import Component from '@ember/component';
import { underscore } from '@ember/string';
import EmberObject, { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import _ from 'npm:lodash';

const Permission = EmberObject.extend({
  context: null,
  name: null,
  values: null,
  hasHelpText: false,
  role: readOnly('context.role'),

  translationKey: computed('name', function() {
    return underscore(this.get('name'));
  }),

  isEnabled: computed('values.[]', 'role.permissions.@each.value', function() {
    return this.get('values').every((name) => {
      const permission = this.get('role.permissions').findBy('name', name);
      return !!permission && permission.get('value');
    });
  })
});

const PermissionGroup = EmberObject.extend({
  context: null,
  name: null,
  isAvailable: true,
  permissions: null,
  role: readOnly('context.role'),

  translationKey: computed('name', function() {
    return underscore(this.get('name'));
  })
});

const AdminPermissionGroup = PermissionGroup.extend({
  isAvailable: computed('role.roleType', function() {
    return ['ADMIN', 'OWNER'].includes(this.get('role.roleType'));
  })
});

const AgentAndUpPermissionGroup = PermissionGroup.extend({
  isAvailable: computed('role.roleType', function() {
    return ['ADMIN', 'OWNER', 'AGENT'].includes(this.get('role.roleType'));
  })
});

export default Component.extend({
  notification: service(),
  i18n: service(),
  roles: service(),
  role: null,
  availablePermissionGroups: filterBy('permissionGroups', 'isAvailable'),

  initializePermissions: on('init', function() {
    if (!this.get('role.isNew')) { return; }

    _.flatMap(this.get('permissionGroups'), group => group.get('permissions')).forEach(function(permission) {
      permission.set('isEnabled', true);
    });
  }),

  canBeDeleted: computed('role.isNew', 'role.isSystem', function() {
    return !(this.get('role.isNew') || this.get('role.isSystem'));
  }),

  roleType: computed('role.roleType', 'roles.allTypes', function() {
    return this.get('roles.allTypes').findBy('id', this.get('role.roleType'));
  }),

  agentCaseAccessType: computed('role.agentCaseAccess', 'roles.availableAgentCaseAccessTypes', function() {
    return this.get('roles.availableAgentCaseAccessTypes').findBy('id', this.get('role.agentCaseAccess'));
  }),

  permissionGroups: computed(function() {
    const permissionGroup = (name, ...params) => {
      return PermissionGroup.create({ context: this, name: name }, ...params);
    };

    const permission = (name, ...params) => {
      return Permission.create({ context: this, name: name }, ...params);
    };

    const adminPermissionGroup = (name, ...params) => {
      return AdminPermissionGroup.create({ context: this, name: name }, ...params);
    };

    const agentAndUpPermissionGroup = (name, ...params) => {
      return AgentAndUpPermissionGroup.create({ context: this, name: name }, ...params);
    };

    return [
      permissionGroup('cases', {
        permissions: [
          permission('cases-create-reply', {
            values: ['cases.public_reply'],
            qaClass: 'qa-ko-admin_roles-create-public-reply-checkbox'
          }),
          permission('cases-split-and-merge', {
            hasHelpText: true,
            values: [
              'cases.merge',
              'cases.split'
            ]
          }),
          permission('cases-trash', {
            hasHelpText: true,
            values: ['cases.trash']
          }),
          permission('cases-view-trash', {
            hasHelpText: true,
            values: ['cases.view_trash']
          }),
          permission('cases-view-suspended', {
            hasHelpText: true,
            values: ['cases.view_suspended']
          })
        ]
      }),

      permissionGroup('users-and-orgs', {
        permissions: [
          permission('users-and-orgs-create-update', {
            hasHelpText: true,
            values: ['users.update', 'organizations.update'],
            qaClass: 'qa-ko-admin_roles-create-new-users-checkbox'
          }),
          permission('users-and-orgs-delete', {
            hasHelpText: true,
            values: ['users.delete', 'organizations.delete']
          })
        ]
      }),

      permissionGroup('help-center', {
        permissions: [
          permission('help-center-manage', {
            hasHelpText: true,
            values: ['help_center.manage'],
            qaClass: 'qa-ko-admin_roles-manage-helpcenter-checkbox'
          }),
          permission('help-center-manage-articles', {
            hasHelpText: true,
            values: ['help_center_articles.manage']
          }),
          permission('help-center-publish-articles', {
            hasHelpText: true,
            values: ['help_center_articles.publish']
          })
        ]
      }),

      adminPermissionGroup('user-administration', {
        permissions: [
          permission('teams-manage', {
            hasHelpText: true,
            values: ['teams.manage'],
            qaClass: 'qa-ko-admin_roles-manage-teams-checkbox'
          }),
          permission('roles-and-permissions-manage', {
            hasHelpText: true,
            values: ['roles.manage']
          })
        ]
      }),

      adminPermissionGroup('system-administration', {
        permissions: [
          permission('apps-manage', { values: ['apps.manage'] }),
          permission('endpoints-manage', { values: ['endpoints.manage'] }),
          permission('channels-manage', {
            hasHelpText: true,
            values: ['channels.manage']
          }),
          permission('brands-manage', {
            values: ['brands.manage']
          }),
          permission('case-views-manage', {
            values: ['case_views.manage']
          }),
          permission('case-macros-manage', {
            values: ['macros.manage']
          }),
          permission('localization-manage', {
            values: ['localization.manage']
          }),
          permission('automations-manage', {
            hasHelpText: true,
            values: ['automations.manage']
          }),
          permission('slas-and-business-hours-manage', {
            hasHelpText: true,
            values: ['slas.manage', 'business_hours.manage']
          }),
          permission('case-fields-manage', {
            hasHelpText: true,
            values: ['case_fields.manage']
          }),
          permission('users-and-organization-fields-manage', {
            hasHelpText: true,
            values: ['organizations_fields.manage', 'user_fields.manage']
          }),
          permission('settings-manage', {
            hasHelpText: true,
            values: ['settings.manage']
          })
        ]
      }),

      agentAndUpPermissionGroup('insights', {
        permissions: [
          permission('insights-access', {
            hasHelpText: true,
            values: ['insights.access']
          })
        ]
      })
    ];
  }),

  // Actions
  actions: {
    save() {
      return this.get('role').save().then((role) => {
        const adapter = getOwner(this).lookup('adapter:application');

        const permissions = this
          .get('availablePermissionGroups')
          .reduce(function(memo, permissionGroup) {
            permissionGroup.get('permissions').forEach(function(permission) {
              permission.get('values').forEach(function(name) {
                memo[name] = permission.get('isEnabled') ? 1 : 0;
              });
            });

            return memo;
          }, {});

        return adapter.ajax(
          `${adapter.namespace}/roles/${role.get('id')}/permissions`,
          'PUT',
          { data: { permission: permissions } }
        ).then(() => {
          role.get('permissions').reload();
        });
      });
    },

    deleteRole() {
      return this.get('role').destroyRecord().then(() => {
        this.send('success');
      });
    },

    success() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });

      if (this.attrs.onSave) {
        this.attrs.onSave();
      }
    },

    selectRoleType(roleType) {
      this.set('role.roleType', roleType.get('id'));
    },

    selectAgentCaseAccessType(agentCaseAccessType) {
      this.set('role.agentCaseAccess', agentCaseAccessType.get('id'));
    }
  }
});
