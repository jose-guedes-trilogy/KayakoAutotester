import { moduleFor, test } from 'ember-qunit';
import EmberObject from '@ember/object';

moduleFor('adapter:brand', 'Unit | Adapter | brand', {
  integration: true
});

test('buildURL', function(assert) {
  let session = EmberObject.create();
  let adapter = this.subject({ session });
  let result = adapter.buildURL('brand', '1');

  assert.ok(result.includes('-ssl_certificate'),
    `ensures -ssl_certificate is present (was ${result})`);
});
