import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';

import { variation } from 'ember-launch-darkly';

const PATH = '/notification_preferences';

export default Service.extend({
  store: service(),

  _preferences: null,

  preferences: computed.reads('_preferences'),

  init() {
    this._super(...arguments);

    this.set('_preferences', []);
  },

  loadPreferences() {
    return this.get('_loadPreferences').perform();
  },

  savePreferences(preferences) {
    return this.get('_savePreferences').perform(preferences);
  },

  isSaving: computed.reads('_savePreferences.isRunning'),

  isDesktopNotification(notificationType) {
    let preference = this._preference(notificationType);

    return preference.channelDesktop;
  },

  _preference(notificationType) {
    return this.get('preferences').findBy('notificationType', notificationType);
  },

  _loadPreferences: task(function * () {
    if (!variation('ops-refactor-notification-preferences-data-retrieval')) {
      return;
    }

    return this._load()
      .then(result => {
        let preferences = result.data.map(this._deserializePreference);
        this.get('_preferences').clear();
        this.get('_preferences').addObjects(preferences);

        return result;
      });
  }).drop(),

  _savePreferences: task(function * (preferences) {
    let data = preferences.map(this._serializePreference);

    yield this._save(data);

    return this.loadPreferences();
  }).drop(),

  _deserializePreference(pref) {
    return {
      notificationType: pref.notification_type,
      channelDesktop: pref.channel_desktop,
      channelMobile: pref.channel_mobile,
      channelEmail: pref.channel_email
    };
  },

  _serializePreference(pref) {
    return {
      notification_type: pref.notificationType,
      channel_desktop: pref.channelDesktop,
      channel_mobile: pref.channelMobile,
      channel_email: pref.channelEmail
    };
  },

  _adapter() {
    return this.get('store').adapterFor('application');
  },

  _url() {
    let adapter = this._adapter();
    return `${adapter.namespace}${PATH}`;
  },

  _load() {
    let adapter = this._adapter();
    let url = this._url();

    return adapter.ajax(url, 'GET');
  },

  _save(data) {
    let adapter = this._adapter();
    let url = this._url();

    return adapter.ajax(url, 'PUT', { data: { values: data } });
  }
});
