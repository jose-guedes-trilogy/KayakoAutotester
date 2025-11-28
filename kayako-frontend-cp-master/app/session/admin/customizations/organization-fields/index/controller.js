import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  customFields: service('custom-fields'),
  notification: service(),
  i18n: service(),
  session: service(),
  confirmation: service(),

  // CPs
  tabs: computed(function() {
    return [{
      id: 'conversation',
      label: this.get('i18n').t('admin.casefields.title'),
      routeName: 'session.admin.customizations.case-fields',
      dynamicSegments: [],
      queryParams: null
    },
    {
      id: 'organization',
      label: this.get('i18n').t('admin.organizationfields.title'),
      routeName: 'session.admin.customizations.organization-fields',
      dynamicSegments: [],
      queryParams: null
    },
    {
      id: 'user',
      label: this.get('i18n').t('admin.userfields.title'),
      routeName: 'session.admin.customizations.user-fields',
      dynamicSegments: [],
      queryParams: null
    }];
  }),

  customfields: computed(
    'model.@each.isEnabled',
    'model.@each.sortOrder',
    function() {
      return this.get('model').filter((field) => {
        return field.get('isEnabled') && !field.get('isSystem');
      }).sortBy('sortOrder');
    }
  ),

  disabledfields: computed('model.@each.isEnabled', function() {
    return this.get('model').filter((field) => {
      return !field.get('isEnabled');
    });
  }),

  // Actions
  actions: {
    transitionToNewFieldRoute() {
      this.transitionToRoute('session.admin.customizations.organization-fields.select-type');
    },

    toggleEnabledStatus(field, e) {
      e.stopPropagation();
      this.get('customFields').toggleEnabled(field).then(() => {
        let notificationMessage;
        if (field.get('isEnabled')) {
          notificationMessage = this.get('i18n').t('admin.organizationfields.enabled.success_message');
        } else {
          notificationMessage = this.get('i18n').t('admin.organizationfields.disabled.success_message');
        }

        this.get('notification').success(notificationMessage);
      });
    },

    delete(field, e) {
      e.preventDefault();
      e.stopPropagation();

      return this.get('confirmation').confirm({
        intlConfirmationBody: 'generic.confirm.delete'
      })
      .then(() => field.destroyRecord())
      .then(() => {
        let msg = this.get('i18n').t('admin.organizationfields.delete.success_message');
        this.get('notification').success(msg);
      });
    },

    editField(field) {
      this.transitionToRoute('session.admin.customizations.organization-fields.edit', field.id);
    },

    reorderCustomFields(orderedCustomFields) {
      this.get('customFields').reorder(this.get('model'), orderedCustomFields, this.get('session.sessionId'));
    }
  }
});
