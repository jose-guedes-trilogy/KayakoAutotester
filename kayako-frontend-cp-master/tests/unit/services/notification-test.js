import { moduleFor, test } from 'ember-qunit';
import { assign } from '@ember/polyfills';
import moment from 'moment';

moduleFor('service:notification', 'Unit | Service | notification');

test('adding identical notifications in quick succession', function(assert) {
  let n1 = { type: 'INFO', message: 'Test message', sticky: false };
  let t1 = moment().toDate();

  let n2 = assign({}, n1);
  let t2 = moment(t1).add(0.5, 'seconds').toDate();

  let n3 = assign({}, n1, { message: 'Within threshold but a different message' });
  let t3 = moment(t1).add(0.5, 'seconds').toDate();

  let n4 = assign({}, n1);
  let t4 = moment(t1).add(1, 'seconds').toDate();

  let service = this.subject();

  service.add(n1, t1);
  service.add(n2, t2);
  service.add(n3, t3);
  service.add(n4, t4);

  let actual = service.get('notifications');

  assert.deepEqual(actual, [{
    type: 'INFO',
    message: 'Test message',
    sticky: false
  }, {
    type: 'INFO',
    message: 'Within threshold but a different message',
    sticky: false
  }, {
    type: 'INFO',
    message: 'Test message',
    sticky: false
  }]);
});
