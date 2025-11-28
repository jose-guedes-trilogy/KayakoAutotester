import { extractPathFromUrl } from 'frontend-cp/helpers/extract-path-from-url';
import { module, test } from 'qunit';

module('Unit | Helper | extract path from url');

test('Returns empty string for an empty url ', function(assert) {
  assert.equal(extractPathFromUrl(''), '');
});

test('Returns hostname when url has no pathname', function(assert) {
  assert.equal(extractPathFromUrl('http://www.example.com'), 'www.example.com');
  assert.equal(extractPathFromUrl('http://www.example.com/'), 'www.example.com');
});

test('Returns pathname if it is present', function(assert) {
  assert.equal(extractPathFromUrl('http://www.example.com/short-path#test?test=test'), '/short-path');
});

test('Returns pathname even in the absence of protocol', function(assert) {
  assert.equal(extractPathFromUrl('www.example.com/short-path'), '/short-path');
});
