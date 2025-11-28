
import { makeDate } from 'frontend-cp/helpers/make-date';
import { module, test } from 'qunit';

module('Unit | Helper | make-date');

test('it works', function(assert) {
  let actual = makeDate(['2016-12-31']);
  let expected = new Date(2016, 11, 31, 0, 0, 0, 0);
  assert.equal(actual.toISOString(), expected.toISOString());
});

