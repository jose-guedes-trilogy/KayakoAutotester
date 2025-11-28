import { run } from '@ember/runloop';
import { moduleFor, test } from 'ember-qunit';
import Service from '@ember/service';

moduleFor('service:error-handler/resource-not-found-strategy', 'Unit | Service | error-handler/resource-not-found-strategy', {
  integration: true
});

test('test process method', function(assert) {
  assert.expect(6);

  let subject = this.subject({
    i18n: Service.create({
      t() {
        return 'title here';
      }
    }),
    notification: Service.create({
      add({ type, title, body, autodismiss }) {
        assert.equal(type, 'error');
        assert.equal(title, 'title here');
        assert.ok(autodismiss);
      }
    }),
    router: Service.create({
      transitionTo(route, options, params) {
        assert.equal(route, '/agent');
      }
    })
  });

  subject.accept('record');

  run(() => {
    assert.equal(subject.get('records.length'), 1);
    subject.process();
    assert.equal(subject.get('records.length'), 0);
  });
});
