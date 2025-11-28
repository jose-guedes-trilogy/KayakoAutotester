import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { variation } from 'ember-launch-darkly';

export default Service.extend({
  store: service(),
  errorHandler: service(),
  totalItems: null,
  page: 0,
  perPage: 20,

  init() {
    this._super(...arguments);
    this.set('notifications', []);
  },

  reset() {
    this.set('notifications', []);
    this.set('page', 0);
  },

  hasMore: computed('notifications.[]', function () {
    const notificationsCount = this.get('notifications').length;
    return this.get('totalItems') === null || this.get('totalItems') > notificationsCount;
  }),

  /**
   * Paginate over list of notifications. This method will
   * take care of finding out whether to make the network
   * request or not. Use `this.hasMore` property to know
   * if more results are to be paginated.
   *
   * @method paginate
   *
   * @return {Promise}
   */
  paginate (reload) {
    if (!this.get('hasMore')) {
      return;
    }

    if (reload) {
      this.set('page', 0);
    }

    /**
     * Increment the page
     */
    this.incrementProperty('page', 1);
    return this
      .get('store')
      .query('notification', this.getParams())
      .then((response) => {
        this.set('totalItems', response.get('meta.total'));
        if (reload) {
          this.get('notifications').clear();
        }
        this.get('notifications').addObjects(response);
      });
  },

  /**
   * Return the offset, limit and include params for fetching notifications.
   *
   * @method getParams
   *
   * @return {Object}
   */
  getParams() {
    let result = this.getOffsetAndLimit();

    if (variation('release-optimize-notification-center-include')) {
      result.include = 'activity,case,user,action';
    }

    return result;
  },

  /**
   * Returns the offset and limit to be used for fetching
   * notifications
   *
   * @method getOffsetAndLimit
   *
   * @return {Object}
   */
  getOffsetAndLimit () {
    const perPage = this.get('perPage');
    const page = this.get('page');

    return {
      offset: page === 1 ? 0 : perPage * (page - 1),
      limit: perPage
    };
  },

  /**
   * Marks all notifications as read
   *
   * @method markAllAsRead
   *
   * @return {Promise}
   */
  markAllAsRead () {
    /**
     * An array of unread notifications
     */
    const unreads = this.get('notifications').filter((notif) => notif.get('readState') !== 'READ');
    if (!unreads.length) {
      return;
    }

    /**
     * Getting the id of first notification to mark it as READ
     * since everything below it will be marked as READ too
     */
    const maxId = this.get('notifications.firstObject.id');

    /**
     * Locally updating the state of notifications
     */
    unreads.forEach((notif) => (notif.set('readState', 'READ')));

    return this
      .get('store')
      .adapterFor('notification')
      .markAllAs(maxId, 'READ')
      .catch(() => {
        unreads.forEach((notification) => (notification.set('readState', 'SEEN')));
      });
  },

  /**
   * Returns notification for a given id
   *
   * @method getNotificationById
   *
   * @param  {Number}             id
   *
   * @return {Promise}
   */
  getNotificationById (id) {
    return this.get('store').peekRecord('notification', id);
  },

  /**
   * Marks all notifications as seen
   *
   * @method markAllAsSeen
   *
   * @return {Promise}
   */
  markAllAsSeen () {
    const unseens = this.get('notifications').filter((notif) => notif.get('readState') === 'UNSEEN');
    if (!unseens.length) {
      return;
    }

    /**
     * Getting the id of first notification to mark it as SEEN
     * since everything below it will be marked as SEEN too
     */
    const maxId = this.get('notifications.firstObject.id');

    return this
      .get('store')
      .adapterFor('notification')
      .markAllAs(maxId, 'SEEN')
      .catch(() => {
        unseens.forEach((notification) => (notification.set('readState', 'UNSEEN')));
      });
  },

  /**
   * Mark a single notification as read
   *
   * @method markAsRead
   *
   * @param  {Number}   id
   *
   * @return {Promise}
   */
  markAsRead (id) {
    const notification = this.getNotificationById(id);
    if (notification) {
      notification.set('readState', 'READ');
    }

    return this.get('errorHandler')
      .disableWhile(() => {
        return this
          .get('store')
          .adapterFor('notification')
          .markAs(id, 'READ')
          .catch(() => {
            if (notification) {
              notification.set('readState', 'SEEN');
            }
          });
      });
  },

  /**
   * Mark a single notification as seen
   *
   * @method markAsSeen
   *
   * @param  {Object}   notification
   *
   * @return {Promise}
   */
  markAsSeen (notification) {
    notification.set('readState', 'SEEN');
    return this
      .get('store')
      .adapterFor('notification')
      .markAs(notification.get('id'), 'SEEN')
      .catch(() => {
        notification.set('readState', 'UNSEEN');
      });
  },

  /**
   * When notification dropdown is closed, we are removing all notifications
   * after first page (first 20 items) since if user has loaded 100+ notifications,
   * the dropdown would lag while opening next time
   *
   * @method removePaginatedNotifications
   */
  removePaginatedNotifications () {
    const notifications = this.get('notifications');
    const perPage = this.get('perPage');
    const totalCount = notifications.get('length');

    if (totalCount > perPage) {
      notifications.removeAt(perPage, totalCount);
      this.set('page', 1);
    }
  }
});
