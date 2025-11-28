import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',
  model: null,

  session: service(),

  //Lifecycle Hooks
  didReceiveAttrs() {
    let identities = [];

    if (this.get('model.primaryEmailAddress')) {
      identities.push({ type: 'email', value: this.get('model.primaryEmailAddress')});
    }

    if (this.get('model.twitter.screenName')) {
      identities.push({ type: 'twitter', value: this.get('model.twitter.screenName')});
    }

    if (this.get('model.facebook.fullName')) {
      identities.push({ type: 'facebook', value: this.get('model.facebook.fullName')});
    }

    if (this.get('model.primaryPhoneNumber')) {
      identities.push({ type: 'phone', value: this.get('model.primaryPhoneNumber')});
    }

    this.set('identities', identities);
  },

  isMe: computed('session.user.id', 'model.id', function () {
    return this.get('session.user.id') === this.get('model.id');
  })
});
