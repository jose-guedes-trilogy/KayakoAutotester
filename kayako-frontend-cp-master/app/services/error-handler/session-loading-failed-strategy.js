import Service, { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

export default Service.extend({
  notification: service('notification'),
  i18n: service(),
  session: service('session'),
  router: service('-routing'),
  windowService: service('window'),

  init() {
    this._super(...arguments);
    this.records = [];
  },

  accept(record) {
    this.records.push(record);
  },

  process() {
    const recordsCount = this.records.length;

    if (recordsCount) {
      this.get('_transitionToLogin').perform();

      this.records = [];
    }

    return recordsCount;
  },

  _transitionToLogin: task(function * () {
    let {
      router,
      notification,
      session,
      windowService,
    } = this.getProperties('router', 'notification', 'session', 'windowService');

    session.reportSessionExpiry('Invalid/Missing sessionId. Called from app/services/error-handler/session-loading-failed-strategy.js');
    session.clear();

    session.set('loginRedirectPath', windowService.currentPath());

    yield router.transitionTo('login-agent', [], {});

    notification.add({
      type: 'error',
      title: this.get('i18n').t('generic.user_logged_out'),
      body: this.get('i18n').t('generic.session_expired'),
      autodismiss: true
    });
  }).drop()
});
