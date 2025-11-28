import { not } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  notification: service(),
  i18n: service(),
  roles: service(),
  confirmation: service(),
  role: null,

  // CPs
  canDelete: not('role.isSystem'),

  canEdit: computed('role.roleType', 'role.isSystem', 'roles.editableSystemTypes', function() {
    return !this.get('role.isSystem') ||
           this.get('roles.editableSystemTypes').findBy('id', this.get('role.roleType'));
  }),

  roleType: computed('role.roleType', function() {
    return this.get('roles.allTypes').findBy('id', this.get('role.roleType'));
  }),

  // Actions
  actions: {
    edit(role, event) {
      event.stopPropagation();

      if (this.attrs.onEdit) {
        this.attrs.onEdit(role);
      }
    },

    delete(role, event) {
      event.stopPropagation();
      this.get('confirmation').confirm({ intlConfirmationBody: 'generic.confirm.delete' })
        .then(() => role.destroyRecord())
        .then(() => this.get('notification').success(this.get('i18n').t('admin.roles.index.deletion_successful_notification')));
    }
  }
});
