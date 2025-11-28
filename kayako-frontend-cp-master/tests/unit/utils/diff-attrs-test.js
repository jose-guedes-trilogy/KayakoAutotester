import { attrChanged } from 'frontend-cp/utils/diff-attrs';
import { module, test } from 'qunit';

module('Unit | Utility | diff-attrs | attrChanged');

test('with no changes to compare', function(assert) {
  assert.ok(!attrChanged(null, 'id'), 'should not have changed');
});

test('with empty changes', function(assert) {
  assert.ok(!attrChanged([], 'id'), 'should not have changed');
});

test('when the values remain the same', function(assert) {
  const from = {id: 'foo'};
  const to = {id: 'foo'};

  assert.ok(!attrChanged([from, to], 'id'), 'should not have changed');
});

test('when the values change', function(assert) {
  const from = {id: 'foo'};
  const to = {id: 'bar'};

  assert.ok(attrChanged([from, to], 'id'), 'should have changed');
});

test('from null to present', function(assert) {
  const from = null;
  const to = {id: 'bar'};

  assert.ok(attrChanged([from, to], 'id'), 'should have changed');
});

test('from present to null', function(assert) {
  const from = {id: 'bar'};
  const to = null;

  assert.ok(attrChanged([from, to], 'id'), 'should have changed');
});
