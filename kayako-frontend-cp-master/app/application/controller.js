import { observer, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  urlService: service('url'),
  notificationService: service('notification'),
  plan: service(),
  config: service(),
  launchDarkly: service(),
  session: service(),

  appVersion: computed(function() {
    return this.get('config.currentRevision');
  }),

  activeVersion: computed('launchDarkly.app-version', function() {
    let version = this.get('launchDarkly.app-version');

    if (!version || version === 'undefined') {
      return null;
    }

    return version;
  }),

  notificationFrequency: computed('launchDarkly.app-version-notification-frequency', function() {
    let frequency = this.get('launchDarkly.app-version-notification-frequency');

    return this._parseFrequency(frequency);
  }),

  currentPathDidChange: observer('currentPath', function() {
    this.get('urlService').set('currentPath', this.get('currentPath'));
  }),

  /**
   * Active notifications
   * @return {Object[]} Array of notification objects
   */
  notifications: computed('notificationService.notifications.[]', function() {
    let notificationService = this.get('notificationService');
    return notificationService.get('notifications');
  }),

  grammarlyDetected: Ember.computed(function() {
    return document.body.dataset && document.body.dataset.grCSLoaded === 'true';
  }),

  actions: {
    onNotificationClosed(notification) {
      let notificationService = this.get('notificationService');
      notificationService.remove(notification);
    }
  },

  _parseFrequency(val) {
    const defaultValue = 0;

    if (!val || val === 'undefined') {
      return defaultValue;
    }
    try {
      val = parseInt(val);

      if (isNaN(val)) {
        return defaultValue;
      }

      return val;
    } catch (e) {
      return defaultValue;
    }
  },
});
