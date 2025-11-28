import { inject as service } from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { isBlank } from '@ember/utils';
import {
  validateEmailFormat,
  validateTwitterHandleFormat
} from 'frontend-cp/utils/format-validations';

const titles = {
  'identity-email': 'generic.identities.add.email',
  'identity-twitter': 'generic.identities.add.twitter',
  'identity-phone': 'generic.identities.add.phone'
};
const placeholders = {
  'identity-email': 'generic.identities.placeholders.email',
  'identity-twitter': 'generic.identities.placeholders.twitter',
  'identity-phone': 'generic.identities.placeholders.phone'
};
const inputTypes = {
  'identity-email': 'email',
  'identity-twitter': 'text',
  'identity-phone': 'tel'
};

export default Component.extend({
  localClassNames: ['form'],
  i18n: service(),
  // CPs
  title: computed('identity', function() {
    return titles[this.get('identity.constructor.modelName')];
  }),

  placeholder: computed('identity', function() {
    return placeholders[this.get('identity.constructor.modelName')];
  }),

  inputType: computed('identity', function() {
    return inputTypes[this.get('identity.constructor.modelName')];
  }),

  didInsertElement() {
    this.$('input').focus();
  },

  // Actions
  actions: {
    save() {
      const identity = this.get('identity');
      identity.get('errors').clear();
      if (identity.constructor.modelName === 'identity-email') {
        return this.saveEmail(this.get('mainField').trim());
      } else if (identity.constructor.modelName === 'identity-twitter') {
        return this.saveTwitter(this.get('mainField').trim());
      } else if (identity.constructor.modelName === 'identity-phone') {
        return this.savePhone(this.get('mainField').trim());
      }
    },

    cancel(e) {
      e.preventDefault();
      this.attrs.cancel();
    }
  },

  // Methods
  saveEmail(email) {
    const identity = this.get('identity');
    if (validateEmailFormat(email)) {
      identity.set('email', email);
      return this.attrs.save(identity);
    } else {
      let message = this.get('i18n').t('generic.identities.errors.invalid_email_format');
      identity.get('errors').add('email', message);
      return EmberPromise.reject(false);
    }
  },

  saveTwitter(screenName) {
    const identity = this.get('identity');
    if (screenName.indexOf('@') !== 0) {
      screenName = '@' + screenName; // Add @sign for validation
    }
    if (validateTwitterHandleFormat(screenName)) {
      identity.set('screenName', screenName.slice(1)); // Remove @ before save
      return this.attrs.save(identity);
    } else {
      let message = this.get('i18n').t('generic.identities.errors.invalid_twitter_handle_format');
      identity.get('errors').add('screenName', message);
      return EmberPromise.reject(false);
    }
  },

  savePhone(number) {
    const sanitizedNumber = number.replace(/[^0-9+]/g, '');
    if (isBlank(sanitizedNumber)) {
      return EmberPromise.reject(false);
    }
    const identity = this.get('identity');
    identity.set('number', sanitizedNumber);
    return this.attrs.save(identity);
  }
});
