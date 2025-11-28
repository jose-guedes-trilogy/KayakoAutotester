import { inject as service } from '@ember/service';
import Component from '@ember/component';
import EmberObject, { set, get, computed } from '@ember/object';

export default Component.extend({
  // Params
  fields: EmberObject.create({}), // it's ok for this to be in the class definition since this object
              // is never mutated
  onSubmit: () => {},
  onError: () => {},
  onSuccess: () => {},
  onCancel: () => {},

  isSubmitting: false,

  notificationService: service('notification'),

  tagName: 'form',
  classNameBindings: ['isValid:ko-form--is-valid', 'isSubmitting:ko-form--is-submitting'],

  fieldsArray: computed('fields', function() {
    let fields = this.get('fields');
    return Object.keys(fields).map(key => fields[key]);
  }),

  fieldValuesArray: computed('fieldsArray.@each.value', function() {
    return this.get('fieldsArray').map(field => field.value);
  }),

  fieldValidatorsArray: computed('fieldsArray.@each.validator', function() {
    return this.get('fieldsArray').map(field => field.validator);
  }),

  isFormValid: computed('fieldValuesArray.[]', 'fieldValidatorsArray.[]', function() {
    // TODO: Fix flaky Ember watching
    this.get('fieldValuesArray');
    this.get('fieldValidatorsArray');

    let fields = this.get('fields');
    return getAreFieldsValid(fields);


    function getAreFieldsValid(fields) {
      return Object.keys(fields).every(key => {
        let field = fields[key];
        return isFieldValid(field.value, field.validator);
      });
    }

    function isFieldValid(value, validator) {
      if (!validator || !value) {
        return true;
      }
      let errors = validator(value);
      let hasErrors = errors && ((typeof errors === 'string') || (Array.isArray(errors) && errors.length > 0));
      return !hasErrors;
    }
  }),

  isSubmitDisabled: computed('isFormValid', 'isSubmitting', function () {
    return !this.get('isFormValid') || this.get('isSubmitting');
  }),

  submit(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.get('isFormValid')) { return false; }
    if (this.get('isSubmitting')) { return false; }
    let fields = this.get('fields');

    let fieldValues = Object.keys(fields).reduce(
      (fieldValues, key) => {
        fieldValues[key] = fields[key].value;
        return fieldValues;
      },
      {}
    );
    this.set('isSubmitting', true);
    return this.attrs.onSubmit(fieldValues)
      .then(response => {
        if (this.attrs.onSuccess) {
          this.attrs.onSuccess(response);
        }
        return response;
      })
      .catch(error => {
        Object.keys(fields).forEach(field => {
          set(get(fields, field), 'errors', []);
        });
        if (error && error.errors && error.errors.length) {
          error.errors
            .filter(errorData => Boolean(errorData.parameter))
            .forEach(errorData => {
              let fieldName = errorData.parameter;
              let relatedField = get(fields, fieldName);
              if (relatedField) {
                relatedField.errors.pushObject(EmberObject.create({
                  message: errorData.message
                }));
              }
            });
        }
        if (this.attrs.onError) {
          this.attrs.onError(error);
        }
      })
      .finally(() => {
        if (this.get('isDestroying') || this.get('isDestroyed')) { return; }
        this.set('isSubmitting', false);
      });
  },

  actions: {
    cancel() {
      this.attrs.onCancel();
    }
  }
});
