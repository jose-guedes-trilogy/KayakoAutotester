import { moduleFor, test } from 'ember-qunit';

moduleFor('service:validation', 'Unit | Service | validation', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

// Replace this with your real tests.
test('return false when value does not exists', function(assert) {
  assert.expect(1);

  let service = this.subject();
  assert.equal(service.exists(undefined), false);
});

test('return false when value is an empty string', function(assert) {
  assert.expect(1);

  let service = this.subject();
  assert.equal(service.exists(''), false);
});

test('return false when value is null', function(assert) {
  assert.expect(1);

  let service = this.subject();
  assert.equal(service.exists(null), false);
});

test('return true when value does exists', function(assert) {
  assert.expect(1);

  let service = this.subject();
  assert.equal(service.exists('foo'), true);
});

test('return false when value is not an email address', function(assert) {
  assert.expect(1);

  let service = this.subject();
  assert.equal(service.isEmail('foo'), false);
});

test('return true when value is an email address', function(assert) {
  assert.expect(1);

  let service = this.subject();
  assert.equal(service.isEmail('foo@bar.com'), true);
});

test('return false when value is not a phone number', function(assert) {
  assert.expect(1);

  let service = this.subject();
  assert.equal(service.isPhone('9192abc'), false);
});

test('return true when value is a phone number', function(assert) {
  assert.expect(1);

  let service = this.subject();
  assert.equal(service.isPhone('9990345109'), true);
});

test('return true when value is a phone number with dashes', function(assert) {
  assert.expect(1);

  let service = this.subject();
  assert.equal(service.isPhone('999-034-5109'), true);
});

test('return object of errors from validateAll when validation fails', function(assert) {
  assert.expect(1);
  const data = {
    name: '',
    email: 'foo'
  };

  const rules = {
    name: ['exists'],
    email: ['exists', 'isEmail']
  };

  const messages = {
    name: 'name is required',
    email: 'enter valid email address'
  };

  const expected = {
    name: [{message: 'name is required'}],
    email: [{message: 'enter valid email address'}]
  };

  let service = this.subject();
  assert.deepEqual(service.validateAll(data, rules, messages), expected);
});

test('return object of errors from validateAll when validation fails on single field', function(assert) {
  assert.expect(1);
  const data = {
    name: 'foo',
    email: 'foo'
  };

  const rules = {
    name: ['exists'],
    email: ['exists', 'isEmail']
  };

  const messages = {
    name: 'name is required',
    email: 'enter valid email address'
  };

  const expected = {
    email: [{message: 'enter valid email address'}]
  };

  let service = this.subject();
  assert.deepEqual(service.validateAll(data, rules, messages), expected);
});

test('return empty object when everything is good', function(assert) {
  assert.expect(1);
  const data = {
    name: 'foo',
    email: 'foo@bar.com'
  };

  const rules = {
    name: ['exists'],
    email: ['exists', 'isEmail']
  };

  const messages = {
    name: 'name is required',
    email: 'enter valid email address'
  };

  const expected = {};

  let service = this.subject();
  assert.deepEqual(service.validateAll(data, rules, messages), expected);
});
