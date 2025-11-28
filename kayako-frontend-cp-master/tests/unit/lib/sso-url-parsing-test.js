import { module, test } from 'qunit';
import { replaceActionUrl } from 'frontend-cp/lib/sso-url-parsing';

module('Unit | Lib | sso url parsing');

test('url is invalid', function(assert) {
  assert.expect(1);

  let url = 'xxxx';
  let fn = () => {
    replaceActionUrl(url, '/conversations/1');
  };

  assert.throws(fn, 'Throw error when url is invalid');
});

test('returnto query param doesn\'t exist', function(assert) {
  assert.expect(1);

  let url = 'https://foo.com';
  let result = replaceActionUrl(url, '/conversations/1');

  assert.equal(result, 'https://foo.com/');
});

test('returnto query param is blank', function(assert) {
  assert.expect(1);

  let url = 'https://foo.com?returnto=';
  let fn = () => {
    replaceActionUrl(url, '/conversations/1');
  };

  assert.throws(fn, 'Throw error when returnto is invalid');
});

test('returnto query param exists but doesn\'t include an action query param', function(assert) {
  assert.expect(2);

  let url = 'https://foo.com?returnto=https%3A%2F%2Fexample.com%2Fjwt%2F%3Ftype%3Dagent';
  let result = replaceActionUrl(url, '/conversations/1');

  assert.equal(result, 'https://foo.com/?returnto=https%3A%2F%2Fexample.com%2Fjwt%2F%3Ftype%3Dagent');
  assert.equal(decodeURIComponent(result), 'https://foo.com/?returnto=https://example.com/jwt/?type=agent');
});

test('returnto query param exists including empty action query param', function(assert) {
  assert.expect(2);

  let url = 'https://foo.com?returnto=https%3A%2F%2Fexample.com%2Fjwt%2F%3Ftype%3Dagent%26action%3D';
  let result = replaceActionUrl(url, '/conversations/1');

  assert.equal(result, 'https://foo.com/?returnto=https%3A%2F%2Fexample.com%2Fjwt%2F%3Ftype%3Dagent%26action%3D%252Fconversations%252F1');
  assert.equal(decodeURIComponent(result), 'https://foo.com/?returnto=https://example.com/jwt/?type=agent&action=%2Fconversations%2F1');
});

test('returnto query param exists including action query param', function(assert) {
  assert.expect(2);

  let url = 'https://foo.com?returnto=https%3A%2F%2Fexample.com%2Fjwt%2F%3Ftype%3Dagent%26action%3Dagent';
  let result = replaceActionUrl(url, '/conversations/1');

  assert.equal(result, 'https://foo.com/?returnto=https%3A%2F%2Fexample.com%2Fjwt%2F%3Ftype%3Dagent%26action%3D%252Fconversations%252F1');
  assert.equal(decodeURIComponent(result), 'https://foo.com/?returnto=https://example.com/jwt/?type=agent&action=%2Fconversations%2F1');
});
