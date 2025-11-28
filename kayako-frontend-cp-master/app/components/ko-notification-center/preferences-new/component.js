import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { variation } from 'ember-launch-darkly';

import RSVP from 'rsvp';

export default Component.extend({
  session: service(),
  store: service(),
  notification: service(),
  notificationPreferences: service(),
  profilePreferences: service(),
  i18n: service(),

  preferences: null,
  soundPreferences: null,
  onClose: () => {},

  init() {
    this._super(...arguments);

    let preferences = this.get('notificationPreferences.preferences').map(pref => Object.assign({}, pref));
    let soundPreferences = Object.assign({}, {
      desktopSoundAlerts: this.get('profilePreferences.preferences.desktopSoundAlerts'),
    });
    this.set('preferences', preferences);
    this.set('soundPreferences', soundPreferences);
  },

  isSaving: computed.or('notificationPreferences.isSaving', 'profilePreferences.isSaving'),

  isEdited: computed('_isEditedOld', '_isEditedNew', function() {
    if (variation('release-live-chat-notification-improvements')) {
      return this.get('_isEditedNew');
    }
    return this.get('_isEditedOld');
  }),

  _isEditedNew: computed.or('isNotificationPreferencesEdited', 'isSoundPreferencesEdited'),
  _isEditedOld: computed.reads('isNotificationPreferencesEdited'),

  isNotificationPreferencesEdited: computed('preferences.@each.{channelDesktop,channelMobile,channelEmail}', 'notificationPreferences.preferences.[]', function() {
    let preferences = this.get('preferences');
    let originalPreferences = this.get('notificationPreferences.preferences');
    let editedPreferences = preferences.filter(pref => {
      let original = originalPreferences.findBy('notificationType', pref.notificationType);
      return this._hasDirtyAttributes(pref, original);
    });
    return !isEmpty(editedPreferences);
  }),

  isSoundPreferencesEdited: computed('soundPreferences.desktopSoundAlerts', 'profilePreferences.preferences', function() {
    let preferences = this.get('soundPreferences');
    let originalPreferences = this.get('profilePreferences.preferences');
    return preferences.desktopSoundAlerts !== originalPreferences.desktopSoundAlerts;
  }),

  _hasDirtyAttributes(preference, original) {
    return preference.channelDesktop !== original.channelDesktop ||
      preference.channelMobile !== original.channelMobile ||
      preference.channelEmail !== original.channelEmail;
  },

  actions: {
    save() {
      let preferences = this.get('preferences');
      let soundPreferences = this.get('soundPreferences');

      let onSuccess = () => {
        this.get('notification').add({
          type: 'success',
          title: this.get('i18n').t('notifications.preferences.success'),
          autodismiss: true
        });

        this.get('onClose')();
      };

      let onError = () => {
        this.get('notification').add({
          type: 'error',
          title: this.get('i18n').t('generic.generic_error'),
          autodismiss: true
        });
      };

      if (variation('release-live-chat-notification-improvements')) {
        RSVP.all([
          this.get('notificationPreferences').savePreferences(preferences),
          this.get('profilePreferences').savePreferences(soundPreferences),
        ]).then(onSuccess, onError);
      } else {
        this.get('notificationPreferences').savePreferences(preferences)
          .then(onSuccess, onError);
      }
    }
  }
});
