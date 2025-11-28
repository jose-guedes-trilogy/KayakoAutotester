import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  notification: service('notification'),
  i18n: service(),
  cookies: service(),

  beforeModel(transition) {
    let params = transition.queryParams;

    if (params.code && params.state) {
      this.store.queryRecord('facebook-account-callback', {
        code: params.code,
        state: params.state,
        callback: '/admin/channels/facebook/callback'
      }).then(() => {
        this.get('notification').add({
          type: 'success',
          title: this.get('i18n').t('generic.changes_saved'),
          autodismiss: true
        });
      }).finally(() => {
        let isFacebookPageReconnect = this.get('cookies').read('is_facebook_page_reconnect');
        this._transitionToModal(isFacebookPageReconnect  !== 'true');
      });
    } else {
      this._transitionToModal();
    }
  },

  _transitionToModal(showModal = true) {
    this.transitionTo('session.admin.channels.facebook.index', { queryParams: { showModal } });
  }
});
