import { filterBy } from '@ember/object/computed';
import $ from 'jquery';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { task } from 'ember-concurrency';

export default Component.extend({
  store: service(),
  i18n: service(),
  notification: service(),
  confirmation: service(),

  // CPs
  enabledAccounts: filterBy('accounts', 'isEnabled', true),
  disabledAccounts: filterBy('accounts', 'isEnabled', false),

  // Tasks
  redirectToTwitterAuthenticationEndpoint: task(function * (e) {
    e.stopPropagation();
    const link = yield this.get('store').queryRecord('oauth-link', { callback: '/admin/channels/twitter/callback' });
    window.location.href = link.get('id');
  }).drop(),

  redirectToTwitterAuthenticationForReauthorize: task(function * (account, e) {
    e.stopPropagation();
    const link = yield this.get('store').queryRecord('oauth-link', { callback: '/admin/channels/twitter/reauthorize' });
    window.location.href = link.get('id');
  }).drop(),

  // Actions
  actions: {
    toggleEnabledProperty(account, e) {
      e.stopPropagation();
      account.toggleProperty('isEnabled');
      account.save().then(() => {
        const notificationMessage = this.get('i18n').t(
          account.get('isEnabled') ? 'admin.twitter.enabled.message' : 'admin.twitter.disabled.message'
        );
        this.get('notification').success(notificationMessage);
      });
    },

    editAccount(account, event) {
      if (event && $(event.target).hasClass('js-admin_channels_twitter__delete-button')) {
        return;
      }

      this.get('on-edit')(account);
    },

    delete(account) {
      return this.get('confirmation').confirm({
        intlConfirmationBody: 'generic.confirm.delete'
      })
      .then(() => account.destroyRecord())
      .then(() => {
        let msg = this.get('i18n').t('admin.twitter.deleted.message');
        this.get('notification').success(msg);
      });
    }
  }
});
