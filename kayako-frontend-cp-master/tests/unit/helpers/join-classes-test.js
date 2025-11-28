import { joinClasses } from 'frontend-cp/helpers/join-classes';
import { module, test } from 'qunit';

module('Unit | Helper | join classes');

test('it joins with spaces', function(assert) {
  assert.equal(
    joinClasses(['foo', 'bar', 'baz']),
    'foo bar baz'
  );
});
