import { moduleFor, test } from 'ember-qunit';

moduleFor('adapter:product', 'Unit | Adapter | product', {
  integration: true
});

test('urlForFindAll', function(assert) {
  assert.equal(
    this.subject().urlForFindAll('product'),
    '/api/v1/account/products',
    'it includes the account namespace'
  );
});

test('urlForFindRecord', function(assert) {
  assert.equal(
    this.subject().urlForFindRecord('1', 'product'),
    '/api/v1/account/products/1',
    'it includes the account namespace'
  );
});
