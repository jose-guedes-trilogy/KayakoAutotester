import Component from '@ember/component';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

export default Component.extend({
  //Params:
  model: null,

  customFields: service('custom-fields'),
  notification: service(),
  i18n: service(),
  session: service(),
  confirmation: service(),

  // CPs
  systemfields: computed('model.@each.isSystem', function() {
    return this.get('model').filter((field) => {
      return field.get('isSystem');
    });
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
    toggleEnabledStatus(field, e) {
      e.stopPropagation();
      this.get('customFields').toggleEnabled(field).then(() => {
        let notificationMessage;
        if (field.get('isEnabled')) {
          notificationMessage = this.get('i18n').t('admin.casefields.enabled.success_message');
        } else {
          notificationMessage = this.get('i18n').t('admin.casefields.disabled.success_message');
        }

        this.get('notification').success(notificationMessage);
      });
    },

    deleteField(field, e) {
      e.preventDefault();
      e.stopPropagation();
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'generic.confirm.delete'
      })
      .then(() => field.destroyRecord())
      .then(() => {
        let msg = this.get('i18n').t('admin.casefields.delete.success_message');
        this.get('notification').success(msg);
      });
    },

    editField(field) {
      getOwner(this).lookup('router:main').transitionTo('session.admin.customizations.case-fields.edit', field.id);
    },

    reorderCustomFields(orderedCustomFields) {
      this.get('customFields').reorder(this.get('model'), orderedCustomFields, this.get('session.sessionId'));
    }
  }
});
