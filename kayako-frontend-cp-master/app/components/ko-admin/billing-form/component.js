import $ from 'jquery';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { countries } from 'ember-countries';
import _ from 'npm:lodash';
import jsVat from 'npm:js-vat';

export default Component.extend({

  tagName: '',

  // attributes
  billing: {},
  saving: false,
  vatId: null,

  // state
  countries: countries,
  billingRules: computed(() => {
    return {
      first_name: ['exists'],
      last_name: ['exists'],
      personal_email: ['exists', 'isEmail'],
      home_phone: ['exists', 'isPhone'],
      address1: ['exists'],
      city: ['exists'],
      state: ['exists'],
      postal_code: ['exists'],
      country: ['exists']
    };
  }),

  billingErrorMessages: computed(function () {
    return _(this.get('billing'))
    .map((value, field) => {
      return [field, this.get('i18n').t(`account.trial.billing.error.${field}`)];
    })
    .fromPairs()
    .value();
  }),

  formErrors: {},

  // Services
  validation: service(),
  ratePlansService: service('rateplans'),
  i18n: service(),
  notificationService: service('notification'),

  // Cps
  vatRequired: computed('billing.country', function () {
    return this.get('ratePlansService').countryHasVat(this.get('billing.country.iso'));
  }),

  // methods
  validateBillingDetails () {
    const data = this.get('billing');
    const rules = this.get('billingRules');
    const messages = this.get('billingErrorMessages');
    this.set('formErrors', this.get('validation').validateAll(data, rules, messages));
  },

  validateVatId () {
    const vatId = this.get('vatId');
    Reflect.deleteProperty(this.get('formErrors'), 'vat_id');
    if (!vatId || !this.get('vatRequired')) {
      return;
    }
    const validateVatId = jsVat(this.get('vatId'), this.get('billing.country.iso'));
    if (!validateVatId.valid_country || !validateVatId.valid_vat) {
      this.set('formErrors.vat_id', [{message: this.get('i18n').t('account.trial.billing.error.vat_id')}]);
    }
  },

  actions: {
    validateForm () {
      this.validateBillingDetails();
      this.validateVatId();
    },

    focusErrorFields () {
      const errorField = _.first(_.keys(this.get('formErrors')));
      $(`input[name="${errorField}"]`).focus();
    },

    hasErrors () {
      return _.size(this.get('formErrors'));
    }
  }

});
