import EmberObject from '@ember/object';
import Service, { inject as service } from '@ember/service';
import RSVP from 'rsvp';

export default Service.extend({
  sessionLoadingFailedStrategy: service('error-handler/session-loading-failed-strategy'),
  notificationStrategy: service('error-handler/notification-strategy'),
  permissionDeniedStrategy: service('error-handler/permissions-denied-strategy'),
  resourceNotFoundStrategy: service('error-handler/resource-not-found-strategy'),
  credentialExpiredStrategy: service('error-handler/credential-expired-strategy'),
  formInvalidStrategy: service('error-handler/form-invalid-strategy'),
  genericStrategy: service('error-handler/generic-strategy'),
  licenseExpiredStrategy: service('error-handler/license-expired-strategy'),
  csrfInvalidStrategy: service('error-handler/csrf-invalid-strategy'),

  enabled: true,

  init() {
    this._super(...arguments);

    const strategies = EmberObject.create({
      FIELD_INVALID: this.get('formInvalidStrategy'),
      FIELD_REDUNDANT: null,
      FIELD_REQUIRED: this.get('formInvalidStrategy'),
      FIELD_DUPLICATE: this.get('formInvalidStrategy'),
      FIELD_EMPTY: this.get('formInvalidStrategy'),
      AUTHENTICATION_FAILED: null,
      AUTHORIZATION_REQUIRED: this.get('sessionLoadingFailedStrategy'),
      NOTIFICATION: this.get('notificationStrategy'),
      PERMISSIONS_DENIED: this.get('permissionDeniedStrategy'),
      RESOURCE_NOT_FOUND: this.get('resourceNotFoundStrategy'),
      CREDENTIAL_EXPIRED: this.get('credentialExpiredStrategy'),
      LICENSE_EXPIRED: this.get('licenseExpiredStrategy'),
      PARAMETERS_INCONSISTENT: this.get('sessionLoadingFailedStrategy'),
      ANY_FIELD_REQUIRED: null,
      CSRF_FAILED: this.get('csrfInvalidStrategy'),
      _GENERIC: this.get('genericStrategy')
    });

    this.set('strategies', strategies);
  },

  disableWhile(during) {
    this.set('enabled', false);
    return RSVP.resolve(during())
      .finally(() => this.set('enabled', true));
  },

  process(error) {
    if (!this.get('enabled')) {
      throw error;
    }

    if (error && error.errors) {
      const strategies = this.get('strategies');
      const notifications = error.errors.filterBy('code', 'NOTIFICATION');

      if (notifications.length) {
        this.processNotifications(notifications);
        /*eslint-disable no-console */
        error.errors.filter(error => {
          return error.code !== 'NOTIFICATION';
        }).forEach(err => console.error(new Error(err.code + ': ' + err.message)));
        /*eslint-enable no-console */
      } else {
        this.processErrors(error.errors);
      }

      Object.keys(strategies).forEach((key) => {
        this.processStrategy(key);
      });
    }

    // we have to throw error to reject Promise
    throw error;
  },

  processNotifications(notifications) {
    const strategy = this.getStrategy('NOTIFICATION');
    notifications.forEach(record => strategy.accept(record));
  },

  processErrors(errors) {
    errors.forEach((record) => {
      let strategy = this.getStrategy('_GENERIC');

      if (this.hasStrategy(record.code)) {
        strategy = this.getStrategy(record.code);
      }

      if (strategy) {
        strategy.accept(record);
      }
    });
  },

  hasStrategy(code) {
    const strategies = this.get('strategies');
    return strategies[code] || strategies[code] === null;
  },

  getStrategy(code) {
    const strategies = this.get('strategies');
    return strategies[code];
  },

  processStrategy(key) {
    const strategies = this.get('strategies');
    if (strategies[key]) {
      return strategies[key].process();
    }

    return 0;
  }
});
