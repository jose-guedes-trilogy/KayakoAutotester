import Component from '@ember/component';
import { reads } from '@ember/object/computed';

export default Component.extend({
  tagName: '',

  user: null,

  primaryEmail: reads('user.primaryEmailAddress'),
  primaryPhone: reads('user.primaryPhoneNumber'),
  primaryTwitterHandle: reads('user.primaryTwitterHandle'),
  primaryFacebookUsername: reads('user.primaryFacebookUsername'),
  hasTwoFactorAuthEnabled: reads('user.isMfaEnabled')
});
