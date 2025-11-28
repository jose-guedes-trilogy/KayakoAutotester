import Component from '@ember/component';
import { computed } from '@ember/object';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { htmlSafe } from '@ember/string';

export default Component.extend({
  // Attributes

  tokens: [],
  javascriptLabel: 'Javascript',
  phpLabel: 'PHP',
  stepOneJavascript: htmlSafe(`<div> &lt;script&gt;</div>
    <div>   kayako.ready(function() {</div>
    <div>      kayako.identify(name, email, signature, timestamp); </div>
    <div>   });</div>
    <div> &lt;/script&gt;</div>`),

  stepOnePhp: htmlSafe(`<div>&lt;&quest;php</div>
    <div>   $timestamp = time();</div>
    <div>   $signature = hash_hmac('sha256', ($name . $email . </div>
    <div>   $token . $timestamp), $token);</div>
    <div>&quest;&gt;</div>
    `),

  // Services

  store: service(),
  i18n: service(),
  notification: service(),

  // CPs

  stepTwoJavascript: computed(function() {
    return htmlSafe(`<div> &lt;script&gt;</div>
    <div>   kayako.forget(function() { </div>
    <div>      // ${this.get('i18n').t('admin.messenger.identity_verification.web.step_2.comment')}</div>
    <div>   });</div>
    <div> &lt;/script&gt;</div>`);
  }),

  articleLinkText: computed(function() {
    return htmlSafe(this.get('i18n').t('admin.messenger.identity_verification.web.external_article.link_text'));
  }),

  tabs: computed(function() {
    return [{
      id: 'web',
      label: this.get('i18n').t('admin.messenger.identity_verification.tabs.web'),
      routeName: 'session.admin.messenger.identity-verification.index',
      dynamicSegments: [],
      queryParams: null
    }];
  }),

  webTokenModel: computed.filterBy('tokens', 'deviceType', 'WEB'),
  webToken: computed('webTokenModel', function() {
    if(this.get('webTokenModel').toArray) {
      return get(this.get('webTokenModel').toArray()[0], 'value');
    }
    return '';
  }),

  // Tasks

  updateWebToken: task(function * (deviceType) {
    const that = this;
    try {
      let updateTokenResponse = yield this.get('store').adapterFor('device-token').updateToken(deviceType);
      const tokenRecord = yield this.get('store').findRecord('device-token', deviceType);

      if (!updateTokenResponse.data.value) {
        throw new TypeError();
      }
      tokenRecord.set('value', updateTokenResponse.data.value);

      if(deviceType === 'WEB') {
        this.set('webToken', updateTokenResponse.data.value);
      }
      this.get('notification').add({
        type: 'success',
        title: that.get('i18n').t('admin.messenger.identity_verification.notifications.token_update'),
        autodismiss: true
      });
    } catch(err) {
      this.get('notification').add({
        type: 'error',
        title: that.get('i18n').t('admin.messenger.identity_verification.notifications.error'),
        autodismiss: true
      });
    }
  }).drop(),

  // Actions

  actions: {
    onCopiedToClipboard() {
      this.get('notification').add({
        type: 'success',
        title: this.get('i18n').t('generic.copied_to_clipboard'),
        autodismiss: true
      });
    },
    onRefresh(deviceType) {
      this.get('updateWebToken').perform(deviceType);
    }
  }
});
