import Component from '@ember/component';
import { inject as service } from '@ember/service';
import moment from 'moment';

const LS_NAMESPACE = 'app-version-notifier';
const LS_KEY = 'v1';

export default Component.extend({
  tagName: '',

  appVersion: null,
  activeVersion: null,
  notificationFrequency: 0,

  config: service(),
  cookies: service(),
  locale: service(),

  localStorage: service('localStore'),
  showReloadNotification: false,
  translationsLoaded: false,

  didInsertElement() {
    this._super(...arguments);
    this.get('locale').setup().then(() => {
      this.set('translationsLoaded', true);
    });
  },

  didReceiveAttrs() {
    this._super(...arguments);

    let appVersion = this.get('appVersion');
    let activeVersion = this.get('activeVersion');
    let frequency = this.get('notificationFrequency');
    let isLightningPreview = this._isLightningPreview();

    if (appVersion === null || activeVersion === null || isLightningPreview) {
      this.set('showReloadNotification', false);
    } else if (appVersion !== activeVersion) {
      let isAppropriateToNotifyUser = this._isAppropriateToNotifyUser(frequency);

      if (isAppropriateToNotifyUser) {
        this._updateLastNotified(activeVersion);
        this.set('showReloadNotification', true);
      }
    } else {
      this.set('showReloadNotification', false);
    }
  },

  _isAppropriateToNotifyUser(frequency) {
    let json = this.get('localStorage').getItem(LS_NAMESPACE, LS_KEY, { persist: true });

    if (!json) {
      return true;
    }

    let now = moment.utc();
    let lastNotifiedAt = json.lastNotifiedAt && moment.utc(json.lastNotifiedAt);
    let hoursSinceLastNotification = now.diff(lastNotifiedAt, 'hours');

    return frequency <= hoursSinceLastNotification;
  },

  _isLightningPreview() {
    return this.get('cookies').read(this.get('config.lightningVersionCookieName'));
  },

  _updateLastNotified(version) {
    let data = {
      version,
      lastNotifiedAt: moment.utc().toISOString()
    };

    this.get('localStorage').setItem(LS_NAMESPACE, LS_KEY, data, { persist: true });
  },

  actions: {
    reloadBrowser(e) {
      e.preventDefault();

      window.location.reload(true);
    }
  }
});
