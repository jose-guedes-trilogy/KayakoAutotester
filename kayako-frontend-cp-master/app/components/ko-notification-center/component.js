import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { task } from 'ember-concurrency';
import { run } from '@ember/runloop';
import { isEmpty } from '@ember/utils';

import { variation } from 'ember-launch-darkly';

import { DONK } from 'frontend-cp/services/sound-alerts';

export default Component.extend({
  tagName: '',

  store: service(),
  notificationCenter: service(),
  session: service(),
  browserTab: service(),
  soundAlerts: service(),
  notificationPreferences: service(),
  profilePreferences: service(),

  hasNewNotification: false,
  showPreferencesModal: false,

  hasMore: computed.readOnly('notificationCenter.hasMore'),

  notifications: computed.filterBy('notificationCenter.notifications', 'activity.isActivity'),

  init () {
    this._super(...arguments);
    this.get('getNotifications').perform();
  },

  notificationChannel: computed(function() {
    return this.get('session.user.notificationChannel');
  }),

  /**
   * Task to paginate over notifications. Not droppable
   * since there is no way to trigger this task
   * multiple times.
   */
  getNotifications: task(function * (reload) {
    yield this.get('notificationCenter').paginate(reload);
  }),

  markAllAsRead: task(function * () {
    this._removeUnreadMark();
    yield this.get('notificationCenter').markAllAsRead();
  }).drop(),

  markAllAsSeen: task(function * () {
    this._removeUnreadMark();
    yield this.get('notificationCenter').markAllAsSeen();
  }).drop(),

  _showUnreadMark() {
    this.set('hasNewNotification', true);
  },

  _removeUnreadMark() {
    this.set('hasNewNotification', false);
  },

  _refreshNotifications(reload) {
    if (variation('release-live-chat-notification-improvements')) {
      let before = this.get('notifications');
      this.get('getNotifications').perform(reload)
        .then(() => {
          let after = this.get('notifications');
          let newNotifications = after
            .filter(notification => !before.includes(notification))
            .filter(notification => this._isDesktopNotification(notification))
            .filter(notification => this._isSoundPreferenceEnabled(notification));

          if (!isEmpty(newNotifications)) {
            this.get('soundAlerts').play(DONK);
          }
        });
    } else {
      this.get('getNotifications').perform(reload);
    }
  },

  _isDesktopNotification(notification) {
    let notificationType = notification.get('notificationType');
    return this.get('notificationPreferences').isDesktopNotification(notificationType);
  },

  _isSoundPreferenceEnabled(notification) {
    let profilePreferences = this.get('profilePreferences');

    if (!profilePreferences.get('preferences.desktopSoundAlerts')) { return false; }

    return true;
  },

  actions: {
    closeDropdown(dropdown) {
      // Using 'run.later' to keep dropdown from closing before the route
      // transitioning happens
      run.later(() => {
        dropdown.actions.close();
      });
    },

    showPreferences(e) {
      e.preventDefault();
      this.set('showPreferencesModal', true);
    },

    closePreferecesModal() {
      this.set('showPreferencesModal', false);
    },

    refreshNotifications() {
      const reload = true;

      this._refreshNotifications(reload);
      this._showUnreadMark();

      if (variation('release-live-chat-notification-improvements')) {
        this.get('browserTab').registerAppUpdate();
      }
    },

    removePaginatedNotifications() {
      this.get('notificationCenter').removePaginatedNotifications();
    }
  }
});
