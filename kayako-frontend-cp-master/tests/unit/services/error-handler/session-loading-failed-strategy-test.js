import { run } from '@ember/runloop';
import { moduleFor, test } from 'ember-qunit';
import { getOwner } from '@ember/application';
import EmberObject from '@ember/object';
import Service from '@ember/service';

moduleFor('service:error-handler/session-loading-failed-strategy', 'Unit | Service | error-handler/session-loading-failed-strategy', {
  integration: true,

  beforeEach() {
    getOwner(this).register('controller:login', EmberObject.extend());
  }
});

test('thing', function(assert) {
  assert.expect(11);

  let subject = this.subject({
    i18n: Service.create({
      t() {
        return 'foo';
      }
    }),
    notification: Service.create({
      add({ type, title, body, autodismiss }) {
        assert.equal(type, 'error');
        assert.equal(title, 'foo');
        assert.equal(body, 'foo');
        assert.ok(autodismiss,);
      }
    }),
    session: Service.create({
      reportSessionExpiry(message) {
        assert.equal(message, 'Invalid/Missing sessionId. Called from app/services/error-handler/session-loading-failed-strategy.js');
      },
      clear() {
        assert.ok(true);
      }
    }),
    router: Service.create({
      transitionTo(route, options, params) {
        assert.equal(route, 'login-agent');
        assert.deepEqual(options, []);
        assert.deepEqual(params, {});
      }
    }),
    windowService: Service.create({
      currentPath() {
        return '/cases/views/2';
      }
    })
  });

  subject.accept('blah');

  run(() => {
    assert.equal(subject.get('records.length'), 1);
    subject.process();
    assert.equal(subject.get('records.length'), 0);
  });
});
