import Component from '@ember/component';
import { dasherize } from '@ember/string';
import { computed } from '@ember/object';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import copy from 'frontend-cp/lib/copy-to-clipboard';

export default Component.extend({
  tagName: '',

  // Attributes
  canAddNewIdentity: true,
  primaryOnly: false,

  // Services
  store: service(),
  i18n: service(),
  notification: service('error-handler/notification-strategy'),
  notificationService: service('notification'),
  confirmation: service(),

  // CPs
  emailIdentities: computed('parent.emails.@each.isPrimary', function () {
    return this.sortIdentitiesByPrimary('emails');
  }),
  twitterIdentities: computed('parent.twitter.@each.isPrimary', function () {
    return this.sortIdentitiesByPrimary('twitter');
  }),
  phoneIdentities: computed('parent.phones.@each.isPrimary', function () {
    return this.sortIdentitiesByPrimary('phones');
  }),
  facebookIdentities: computed('parent.facebook.@each.isPrimary', function () {
    return this.sortIdentitiesByPrimary('facebook');
  }),

  sortIdentitiesByPrimary(identity) {
    if (this.get(`parent.${identity}.length`)) {
      let identities = this.get(`parent.${identity}`).filterBy('isNew', false);
      if (!this.get('primaryOnly')) {
        return identities.sortBy('isPrimary').reverse();
      }
      return identities.filterBy('isPrimary');
    }
  },

  // Actions
  actions: {
    copyToClipboard(text) {
      copy(text);
    },

    makePrimaryIdentity(identity) {
      let identities;
      if (identity.constructor.modelName === 'identity-email') {
        identities = this.get('parent.emails');
      } else if (identity.constructor.modelName === 'identity-twitter') {
        identities = this.get('parent.twitter');
      } else if (identity.constructor.modelName === 'identity-phone') {
        identities = this.get('parent.phones');
      } else if (identity.constructor.modelName === 'identity-facebook') {
        identities = this.get('parent.facebook');
      }

      identity.set('isPrimary', true);
      identity.save().then((identity) => this._handleMarkAsPrimaryResponse(identities, identity));
    },

    validateIdentity(identity) {
      if (identity.constructor.modelName === 'identity-email') {
        const adapter = getOwner(this).lookup('adapter:application');
        const url = `${adapter.namespace}/identities/emails/${identity.get('id')}/send_verification_email`;
        adapter.ajax(url, 'PUT');
      }
    },

    markEmailAsValidated(identity) {
      if (identity.constructor.modelName === 'identity-email') {
        identity.set('isValidated', true);
        identity.save().then(() => this.get('notificationService').success(this.get('i18n').t('generic.identities.mark_email_as_validated.success_message', { email: identity.get('email') })));
      }
    },

    // sendValidationEmail(identity) {
    //   const adapter = getOwner(this).lookup('adapter:application');
    //   adapter.ajax(`${adapter.namespace}/identities/emails/${identity.get('id')}/send_validation_email`, 'POST');
    // },

    removeIdentity(identity) {
      let promise;
      if (identity.get('isNew')) {
        promise = RSVP.resolve();
      } else {
        promise = this.get('confirmation').confirm({ intlConfirmationBody: 'generic.confirm.delete'});
      }
      promise.then(() => {
        return identity.destroyRecord();
      }).then(() => {
        this.get('notificationService').success(this.get('i18n').t('generic.identities.removed.success_message'));
      });
    },

    addEmail() {
      this.set('newIdentity', this.get('store').createRecord('identity-email'));
    },

    addTwitter() {
      this.set('newIdentity', this.get('store').createRecord('identity-twitter'));
    },

    addPhone() {
      this.set('newIdentity', this.get('store').createRecord('identity-phone'));
    },

    saveIdentity(identity) {
      identity.set(this.get('parent').constructor.modelName, this.get('parent'));
      return identity.save()
        .then(() => {
          this.get('notificationService').success(this.get('i18n').t('generic.identities.added.success_message'));
          return this.set('newIdentity', null);
        },
          (e) => {
            identity.set('parent', null);
            throw e;
          }
        );
    },

    removeNewIdentity() {
      this.set('newIdentity', null);
    }
  },

  // Marking an identity as primary means that all other identities of the same type for the same
  // user have to me marked as non primary.
  //
  // Presumably, the backend already takes care of that, but the payload only returns the data of
  // the identity being modified, so the changes in other identities are implicit.
  //
  // Due to this, we need to push to the store the updates in the other identitities. That way
  // those identies are modified without making them as dirty for ember-data.
  //
  _handleMarkAsPrimaryResponse(identities, updatedIdentity) {
    const store = this.get('store');

    identities.forEach(identity => {
      if (updatedIdentity !== identity) {
        const nonPrimaryPayload = {
          status: 200,
          data: {
            id: identity.get('id'),
            type: dasherize(updatedIdentity.constructor.modelName),
            attributes: {
              isPrimary: false
            }
          }
        };

        store.push(nonPrimaryPayload);
      }
    });
  }
});
