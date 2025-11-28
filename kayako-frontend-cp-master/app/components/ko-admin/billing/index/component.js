import { Promise as EmberPromise } from 'rsvp';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';
import { countryIsoToValue } from 'ember-countries';
import _ from 'npm:lodash';

export default Component.extend({

  // Attributes
  cards: [],
  account: {},

  // State
  showZuoraForm: false,
  linkingCreditCard: false,
  updatingAccountDetails: false,

  // services
  notificationService: service('notification'),
  i18n: service(),
  store: service(),

  // Computed Properties
  updatingResource: computed('linkingCreditCard', 'cards.isUpdating', function () {
    return this.get('linkingCreditCard') || this.get('cards.isUpdating');
  }),

  billing: computed('account.billTo', function () {
    return {
      first_name: this.get('account.billTo.firstName'),
      last_name: this.get('account.billTo.lastName'),
      personal_email: this.get('account.billTo.personalEmail'),
      home_phone: this.get('account.billTo.homePhone'),
      address1: this.get('account.billTo.address1'),
      address2: this.get('account.billTo.address2'),
      city: this.get('account.billTo.city'),
      state: this.get('account.billTo.state'),
      postal_code: this.get('account.billTo.postalCode'),
      country: {
        iso: this.get('account.billTo.country'),
        country: countryIsoToValue(this.get('account.billTo.country'))
      }
    };
  }),

  actions: {
    onCancel () {
      this.set('showZuoraForm', false);
    },

    cardAdded (data) {
      this.set('linkingCreditCard', true);
      this.set('showZuoraForm', false);
      this.get('notificationService').success(this.get('i18n').t('account.billing.card.added'));
      const adapter = getOwner(this).lookup('adapter:application');
      const options = {
        data: {default_payment: data.refId}
      };
      adapter
        .ajax(`${adapter.namespace}/account`, 'PUT', options)
        .then(() => {
          this.get('cards').update();
        })
        .finally(() => {
          this.set('linkingCreditCard', false);
        });
    },

    addCard () {
      this.set('showZuoraForm', true);
    },

    updateAccountDetails (billingForm) {
      this.set('updatingAccountDetails', true);

      const adapter = getOwner(this).lookup('adapter:application');
      const billingClone = _.clone(this.get('billing'));
      billingClone.country = billingClone.country.iso;

      const options = {
        data: {
          bill_to_contacts: JSON.stringify(billingClone),
          vat_id: this.get('account.vatId')
        }
      };

      return new EmberPromise((resolve, reject) => {
        billingForm.validateForm();
        if (billingForm.hasErrors()) {
          billingForm.focusErrorFields();
          return reject(false);
        }
        adapter.ajax(`${adapter.namespace}/account`, 'PUT', options).then(resolve).catch(reject);
      });
    },

    onSuccess (response) {
      this.get('store').pushPayload('account', response);
      this.set('updatingAccountDetails', false);
      this.get('notificationService').add({
        type: 'success',
        title: this.get('i18n').t('generic.changes_saved'),
        autodismiss: true
      });
    },

    onError () {
      this.set('updatingAccountDetails', false);
      this.get('notificationService').add({
        type: 'error',
        title: this.get('i18n').t('generic.generic_error'),
        autodismiss: true
      });
    },

    markCardAsDefault (card) {
      if (card.get('isDefault')) {
        return;
      }

      const existingDefaultCard = this.get('cards').findBy('isDefault', true);
      if (existingDefaultCard) {
        existingDefaultCard.set('isDefault', false);
      }
      card.set('isDefault', true);

      card
      .save()
      .catch(() => {
        card.set('isDefault', false);
        if (existingDefaultCard) {
          existingDefaultCard.set('isDefault', true);
        }
      });
    }
  }
});
