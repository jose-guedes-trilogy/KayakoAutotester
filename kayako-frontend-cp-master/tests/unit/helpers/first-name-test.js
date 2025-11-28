import { firstName } from 'frontend-cp/helpers/first-name';
import { module, test } from 'qunit';

module('Unit | Helper | first name');

test('it works for first name', function(assert) {
  let result = firstName('Albert Einstein');
  assert.equal(result, 'Albert');
});

test('it works for lowercase first name', function(assert) {
  let result = firstName('albert einstein');
  assert.equal(result, 'Albert');
});

test('it works for no-spaced name or single-word', function(assert) {
  let result = firstName('alberteinstein');
  assert.equal(result, 'Alberteinstein');
});

test('it works for first name in an array', function(assert) {
  let result = firstName('Albert Einstein');
  assert.equal(result, ['Albert']);
});
