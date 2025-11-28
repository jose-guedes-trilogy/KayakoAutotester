import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',

  session: service(),

  result: null,

  // Lifecycle Hooks
  didReceiveAttrs() {
    this._super(...arguments);
    this.set('identities', this.buildIdentities());
  },

  role: computed.readOnly('result.resultData.role'),
  avatar: computed.readOnly('result.resultData.avatar'),
  organization: computed.readOnly('result.resultData.organization'),
  email: computed.readOnly('result.resultData.primaryEmailAddress'),
  twitter: computed.readOnly('result.resultData.twitter'),
  phones: computed.readOnly('result.resultData.phones'),
  facebook: computed.readOnly('result.resultData.facebook'),
  isMe: computed('result.resultData.id', 'session.user.id', function () {
    return this.get('result.resultData.id') === this.get('session.user.id');
  }),

  twitterScreenName: computed('twitter', function() {
    const identity = this.get('twitter.length') && this.get('twitter').find(identity => identity.get('isPrimary'));

    if (!identity) {
      return null;
    }

    return '@' + identity.get('screenName');
  }),

  facebookFullName: computed('facebook', function() {
    const identity = this.get('facebook.length') && this.get('facebook').find(identity => identity.get('isPrimary'));

    if (!identity) {
      return null;
    }

    return identity.get('fullName');
  }),

  phone: computed('phones', function() {
    const identity = this.get('phones.length') && this.get('phones').find(identity => identity.get('isPrimary'));
    if (!identity) {
      return null;
    }

    return identity.get('number');
  }),

  buildIdentities() {
    let identities = [];

    if (this.get('email')) {
      identities.push({ type: 'email', value: this.get('email')});
    }

    if (this.get('twitterScreenName')) {
      identities.push({ type: 'twitter', value: this.get('twitterScreenName')});
    }

    if (this.get('facebookFullName')) {
      identities.push({ type: 'facebook', value: this.get('facebookFullName')});
    }

    if (this.get('phone')) {
      identities.push({ type: 'phone', value: this.get('phone')});
    }

    return identities;
  }
});
