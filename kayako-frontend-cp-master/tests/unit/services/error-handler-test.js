/* eslint-disable no-empty */

import { Promise as EmberPromise } from 'rsvp';

import { run } from '@ember/runloop';
import { getOwner } from '@ember/application';
import { moduleFor, test } from 'ember-qunit';

moduleFor('service:error-handler', 'Unit | Service | error-handler', {
  integration: true,

  beforeEach() {
    const intl = getOwner(this).lookup('service:intl');
    intl.setLocale('en-us');
    intl.addTranslations('en-us', {
      generic: {
        user_logged_out: 'user_logged_out',
        session_expired: 'session_expired',
        generic_error: 'generic_error',
        resource_not_found: 'resource_not_found',
        user_credential_expired: 'user_credential_expired'
      }
    });
  }
});

test('it skips AUTHENTICATION_FAILED error as it does not have separate handler', function (assert) {
  assert.expect(1);

  const service = this.subject();

  let error = {
    errors: [
      {
        code: 'AUTHENTICATION_FAILED',
        message: 'Message: AUTHENTICATION_FAILED',
        more_info: ''
      }
    ]
  };

  let globalProcessedCount = 0;

  service.reopen({
    processStrategy(key) {
      let processedCount = this._super(...arguments);

      if (processedCount !== undefined) {
        globalProcessedCount += processedCount;
      }

      return processedCount;
    }
  });

  try {
    service.process(error);
  } catch (e) {

  }

  assert.equal(
    globalProcessedCount,
    0,
    'Processed count should be zero as AUTHENTICATION_FAILED does not have separate handler.'
  );
});

test('it creates notifications for NOTIFICATION type', function (assert) {
  assert.expect(6);

  const service = this.subject();

  let error = {
    errors: [
      {
        code: 'NOTIFICATION',
        type: 'ERROR',
        message: 'Message 1',
        sticky: false,
        more_info: ''
      },
      {
        code: 'NOTIFICATION',
        type: 'SUCCESS',
        message: 'Message 2',
        sticky: true,
        more_info: ''
      }
    ]
  };

  let strategies = service.get('strategies');

  run(() => {
    strategies.AUTHORIZATION_REQUIRED.get('session').reopen({
      logout() {
        return EmberPromise.resolve();
      }
    });

    strategies.NOTIFICATION.get('notification').reopen({
      add(object) {
        if (object.title === 'Message 1') {
          assert.equal('error', object.type);
          assert.equal('Message 1', object.title);
          assert.equal(true, object.autodismiss);
        } else {
          assert.equal('success', object.type);
          assert.equal('Message 2', object.title);
          assert.equal(false, object.autodismiss);
        }
      }
    });
  });

  try {
    service.process(error);
  } catch (e) {

  }
});

test('it send notification and transitions to the base path when RESOURCE_NOT_FOUND occurs', function (assert) {
  assert.expect(5);

  const service = this.subject();

  let error = {
    errors: [
      {
        code: 'RESOURCE_NOT_FOUND',
        message: '',
        more_info: ''
      }
    ]
  };

  let strategies = service.get('strategies');

  run(() => {
    strategies.AUTHORIZATION_REQUIRED.get('session').reopen({
      logout() {
        return EmberPromise.resolve();
      }
    });

    strategies.RESOURCE_NOT_FOUND.reopen({
      transitionTo(path) {
        assert.equal('/agent', path);
      }
    });

    strategies.RESOURCE_NOT_FOUND.get('notification').reopen({
      add(object) {
        assert.equal('error', object.type);
        assert.equal('resource_not_found', object.title);
        assert.equal(true, object.autodismiss);
        assert.equal(true, object.dismissable);
      }
    });
  });

  try {
    service.process(error);
  } catch (e) {

  }
});

test('it creates notifications when CREDENTIAL_EXPIRED appear', function (assert) {
  assert.expect(4);

  const service = this.subject();

  let error = {
    errors: [
      {
        code: 'CREDENTIAL_EXPIRED',
        message: '',
        more_info: ''
      }
    ]
  };

  let strategies = service.get('strategies');

  run(() => {
    strategies.AUTHORIZATION_REQUIRED.get('session').reopen({
      logout() {
        return EmberPromise.resolve();
      }
    });

    strategies.CREDENTIAL_EXPIRED.get('notification').reopen({
      add(object) {
        assert.equal('error', object.type);
        assert.equal('user_credential_expired', object.title);
        assert.equal(true, object.autodismiss);
        assert.equal(true, object.dismissable);
      }
    });
  });

  try {
    service.process(error);
  } catch (e) {

  }
});

test('it fall backs to the _GENERIC handler if unknown error appear', function (assert) {
  assert.expect(4);

  const service = this.subject();

  let error = {
    errors: [
      {
        code: 'SUPER_UNKNOWN_ERROR',
        message: '',
        more_info: ''
      }
    ]
  };

  let strategies = service.get('strategies');

  run(() => {
    strategies.AUTHORIZATION_REQUIRED.get('session').reopen({
      logout() {
        return EmberPromise.resolve();
      }
    });

    strategies._GENERIC.get('notification').reopen({
      add(object) {
        assert.equal('error', object.type);
        assert.equal('generic_error', object.title);
        assert.equal(true, object.autodismiss);
        assert.equal(true, object.dismissable);
      }
    });
  });

  try {
    service.process(error);
  } catch (e) {

  }
});
