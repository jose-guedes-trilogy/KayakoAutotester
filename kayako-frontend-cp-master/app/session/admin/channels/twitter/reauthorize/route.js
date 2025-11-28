import Route from '@ember/routing/route';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

export default Route.extend({
  notification: service(),
  i18n: service(),

  beforeModel(transition) {
    let params = transition.queryParams;

    const adapter = getOwner(this).lookup('adapter:application');
    let url = `${adapter.namespace}/twitter/account/reauthorize`;

    if (params.oauth_token && params.oauth_verifier) {
      let options = {
        data: {
          oauthToken: params.oauth_token,
          oauthVerifier: params.oauth_verifier
        }
      };

      adapter.ajax(url, 'PUT', options).then(() => {
        this.get('notification').add({
          type: 'success',
          title: this.get('i18n').t('generic.changes_saved'),
          autodismiss: true
        });
      }).finally(() => {
        this.transitionTo('session.admin.channels.twitter.index');
      });
    } else if (params.denied) {
      this.transitionTo('session.admin.channels.twitter.index');
    }
  }
});
