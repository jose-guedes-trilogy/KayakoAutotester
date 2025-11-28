import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  notification: service('notification'),
  i18n: service(),

  beforeModel(transition) {
    let params = transition.queryParams;

    if (params.oauth_token && params.oauth_verifier) {
      this.store.createRecord('twitter-account-callback', {
        oauthToken: params.oauth_token,
        oauthVerifier: params.oauth_verifier
      }).save().then(() => {
        this.get('notification').add({
          type: 'success',
          title: this.get('i18n').t('generic.changes_saved'),
          autodismiss: true
        });

        this.transitionTo('session.admin.channels.twitter.index');
      }).catch(() => {
        this.transitionTo('session.admin.channels.twitter.index');
      });
    }
  }
});
