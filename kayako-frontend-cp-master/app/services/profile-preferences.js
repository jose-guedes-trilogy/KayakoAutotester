import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';

const PATH = '/profile/preferences';

const DEFAULT_PREFERENCES = {
  desktopSoundAlerts: false,
  desktopSoundAlertsRealtimeOnly: false
};

export default Service.extend({
  store: service(),

  _preferences: null,

  preferences: computed('_preferences', function() {
    let preferences = this.get('_preferences');

    return Object.keys(preferences).reduce((prefs, key) => {
      if (prefs[key] === null) {
        prefs[key] = DEFAULT_PREFERENCES[key];
      }

      return prefs;
    }, preferences);
  }),

  init() {
    this._super(...arguments);

    this.set('_preferences', {});
  },

  loadPreferences() {
    return this.get('_loadPreferences').perform();
  },

  savePreferences(preferences) {
    return this.get('_savePreferences').perform(preferences);
  },

  isSaving: computed.reads('_savePreferences.isRunning'),

  _loadPreferences: task(function * () {
    return this._load()
      .then(result => {
        let preferences = this._deserializePreferences(result.data);
        this.set('_preferences', preferences);

        return result;
      });
  }).drop(),

  _savePreferences: task(function * (preferences) {
    let data = this._serializePreference(preferences);

    yield this._save(data);

    return this.loadPreferences();
  }).drop(),

  _deserializePreferences(prefs) {
    return {
      desktopSoundAlerts: prefs.desktop_sound_alerts,
      desktopSoundAlertsRealtimeOnly: prefs.desktop_sound_alerts_realtime_only,
    };
  },

  _serializePreference(prefs) {
    return {
      desktop_sound_alerts: prefs.desktopSoundAlerts,
      desktop_sound_alerts_realtime_only: prefs.desktopSoundAlertsRealtimeOnly,
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

    return adapter.ajax(url, 'PUT', { data });
  }
});
