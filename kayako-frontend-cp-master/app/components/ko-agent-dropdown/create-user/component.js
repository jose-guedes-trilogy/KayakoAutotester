import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { validateEmailFormat } from 'frontend-cp/utils/format-validations';

// TODO: this component needs some love

export default Component.extend({
  // params
  onCreate: () => {},
  onCancel: () => {},

  fields: null,
  shouldShowValidationErrorUser: false,
  shouldShowValidationErrorsEmail: false,
  fullNameValue: '',
  emailValue: '',

  i18n: service(),
  notificationService: service('notification'),
  store: service(),

  fullNameError: computed('fullNameValue', function() {
    let fullName = this.get('fullNameValue');

    if (fullName) {
      return null;
    }

    return this.get('i18n').t('generic.create_user_panel.name_required');
  }),

  emailError: computed('emailValue', function() {
    let email = this.get('emailValue');

    if (!email || validateEmailFormat(email)) {
      return null;
    }

    return this.get('i18n').t('generic.create_user_panel.email_invalid');
  }),

  actions: {
    onError(error) {
      if (error.errors.findBy('code', 'FIELD_DUPLICATE')) {
        const i18n = this.get('i18n');
        this.get('notificationService').removeAll();
        this.get('notificationService').add({
          type: 'error',
          title: i18n.t('generic.create_user_panel.user_exists_toast'),
          autodismiss: true,
          dismissable: false
        });
        this.set('fields.email.errors', [{
          message: i18n.t('generic.create_user_panel.user_exists')
        }]);
      }
    },

    handleFocusOut(flag, event) {
      if ($(event.relatedTarget).is('[data-purpose="cancel"]')) {
        return;
      }

      this.set(flag, true);
    },

    submit() {
      let store = this.get('store');
      const onSubmit = this.get('onSubmit');
      if (onSubmit) { onSubmit(); }
      let savePromise = store.findRecord('role', 4)
        .then(roleModel => {
          let email = store.createRecord('identity-email', {
            isPrimary: true,
            email: this.get('emailValue')
          });
          return store.createRecord('user', {
            role: roleModel,
            fullName: this.get('fullNameValue'),
            emails: [email]
          }).save();
        });

      savePromise.then(() => this.get('dropdown.actions').close());

      return savePromise;
    }
  }
});
