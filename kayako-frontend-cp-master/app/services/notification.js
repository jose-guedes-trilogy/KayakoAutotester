import Service from '@ember/service';
import lodash from 'npm:lodash';
const { isEqual } = lodash;

const DUP_THRESHOLD_MS = 2000;

export default Service.extend({
  notifications: null,
  timestamps: null,

  init() {
    this._super();
    this.set('notifications', this.get('notifications') || []);
    this.set('timestamps', new WeakMap());
  },

  /**
   * Add a notification
   * @param {object} notification Notification object
   * @param {string} notification.type Notification type (allowed values: 'info', 'warning', 'error', 'success')
   * @param {string} notification.title Notification title text
   * @param {string} [notification.body=null] Notification body text
   * @param {boolean} [notification.dismissable=false] Whether to allow the user to close the notification
   * @param {boolean} [notification.autodismiss=false] Whether to automatically dismiss the message after a timeout
   * @param {date} [timestamp] timestamp to associate with the notification
   */
  add(notification, timestamp = new Date()) {
    let notifications = this.get('notifications');
    let timestamps = this.get('timestamps');

    // Skip notifications that should only appear *once* per session.
    if (notification.unique && notifications.findBy('title', notification.title)) {
      return;
    }

    // Skip indentical notifications received in quick succession.
    if (this.get('notifications.length') > 0) {
      let previousNotification = this.get('notifications.lastObject');
      let previousTimestamp = timestamps.get(previousNotification);
      let timeSincePrevious = timestamp - previousTimestamp;
      let withinDupTreshold = timeSincePrevious < DUP_THRESHOLD_MS;

      if (withinDupTreshold && isEqual(notification, previousNotification)) {
        return;
      }
    }

    notifications.pushObject(notification);
    timestamps.set(notification, timestamp);
  },

  success(message, params = {}) {
    let notifications = this.get('notifications');
    notifications.pushObject(Object.assign({
      type: 'success',
      title: message,
      autodismiss: true
    }, params));
  },

  error(message, params = {}) {
    let notifications = this.get('notifications');
    notifications.pushObject(Object.assign({
      type: 'error',
      title: message,
      autodismiss: true
    }, params));
  },

  removeAll() {
    this.get('notifications').clear();
  },

  /**
   * Remove a notification
   * @param {object} notification Notification that has previously been added
   */
  remove(notification) {
    let notifications = this.get('notifications');

    if (notification.onClose) {
      notification.onClose(notification);
    }

    notifications.removeObject(notification);
  }
});
