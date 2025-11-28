import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { task } from 'ember-concurrency';
import { run } from '@ember/runloop';

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
  isOpen: false,

  hasMore: computed.readOnly('notificationCenter.hasMore'),

  notifications: computed.filterBy('notificationCenter.notifications', 'activity.isActivity'),

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

  _handleNewNotification(id) {
    let options = {
      include: 'activity'
    };

    return this.get('store').findRecord('notification', id, options)
      .then(notification => {
        let isDesktopNotification = this._isDesktopNotification(notification);
        let isSoundPreferencesEnabled = this._isSoundPreferenceEnabled(notification);

        if (isDesktopNotification && isSoundPreferencesEnabled) {
          this.get('soundAlerts').play(DONK);
        }
      });
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
    onOpen() {
      const reload = true;
      this.set('isOpen', true);
      this.get('getNotifications').perform(reload)
        .then(() => this.get('markAllAsSeen').perform());
    },

    onClose() {
      this.set('isOpen', false);
      this.get('markAllAsSeen').perform()
        .then(() => this.get('notificationCenter').reset());
    },

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

    onNewNotificationEvent({ resource_id }) {
      if (this.get('isOpen')) {
        const reload = true;
        this.get('getNotifications').perform(reload);
      } else {
        this._showUnreadMark();
      }

      if (variation('release-live-chat-notification-improvements')) {
        this.get('browserTab').registerAppUpdate();
        this._handleNewNotification(resource_id);
      }
    }
  }
});
