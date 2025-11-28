import $ from 'jquery';
import { later } from '@ember/runloop';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  store: service(),
  notification: service('notification'),
  i18n: service(),

  token: null,
  authCode: null,
  disableButton: false,
  recoveryCodes: [],
  recoveryCodeList: null,

  // Used for animations
  visibleStep: 'getStarted',
  previousStep: null,

  init() {
    this._super(...arguments);
    if (this.get('role') === 'enable') {
      this.getToken();
    }
  },

  getToken() {
    this.get('store')
      .adapterFor('user')
      .getQrCode()
      .then((token) => {
        this.set('token', token.data);
      });
  },

  verifyButtonDisabled: computed('authCode', function() {
    return this.get('authCode.length') !== 6;
  }),

  actions: {
    switchModalContent(switchTo) {
      if (switchTo === 'getApp') {
        this.set('previousStep', 'getStarted');
      } else if (switchTo === 'verify') {
        this.set('previousStep', 'getApp');
        later(() => {
          $('#verify-qr-code').focus();
        }, 100);
      }
      this.set('visibleStep', switchTo);
    },

    verifyQrCode(e) {
      e.preventDefault();
      this.set('disableButton', true);

      let data = {
        token: this.get('token.token'),
        otp: this.get('authCode')
      };

      this.get('store')
        .adapterFor('user')
        .sendTwoFactorCode(data)
        .then((response) => {
          const recoveryCodes = response.data.recovery_codes;
          this.set('recoveryCodes', recoveryCodes);
          this.set('recoveryCodeList', recoveryCodes.join(',\n'));
          this.set('visibleStep', 'done');
          this.set('previousStep', 'verify');
        }).then(() => {
          this.get('onUpdate')();
        }).catch(() => {
          this.set('disableButton', false);
          this.get('notification').add({
            type: 'error',
            title: this.get('i18n').t('users.two_factor.enable.error_message'),
            autodismiss: true
          });
        });
    },

    copiedToClipboard() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.copied_to_clipboard'),
        autodismiss: true
      });
    },

    removeTwoFactorAuth() {
      this.set('disableButton', true);

      this.get('store')
      .adapterFor('user')
      .removeSelfTwoFactorAuth()
      .then(() => {
        this.get('onClose')();
        this.get('notification').add({
          type: 'success',
          title: this.get('i18n').t('users.two_factor.disable.notification'),
          autodismiss: true
        });
      }).then(() => {
        this.get('onUpdate')();
      });
    }
  }
});
