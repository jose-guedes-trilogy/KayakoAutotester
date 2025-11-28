import { moduleFor, test } from 'ember-qunit';
import MockSocket from 'frontend-cp/tests/helpers/mocks/socket';
import { next } from '@ember/runloop';

moduleFor('service:socket', 'Unit | Service | socket');

test('connect (when socket emits "open")', function(assert) {
  let service = this.subject();
  let socket = new MockSocket();
  let params = {};

  service.createSocket = (options) => {
    assert.equal(options.params, params, 'created socket with params');
    return socket;
  };

  return service.connect(params)
    .then(() => {
      assert.ok(true, 'resolved the promise');
    });
});

test('connect (when socket emits "error")', function(assert) {
  let service = this.subject();
  let socket = new MockSocket();
  let error = {};

  service.createSocket = () => socket;

  socket.connect = () => next(() => socket.trigger('error', error));

  return service.connect()
    .then(() => assert.ok(false, 'resolved when it should have rejected'))
    .catch(e => assert.equal(e, error, 'rejected with the error'));
});

test('connect (when connected)', function(assert) {
  let service = this.subject();
  let socket = new MockSocket();
  let socketCount = 0;

  service.createSocket = () => {
    socketCount += 1;
    return socket;
  };

  socket.isConnected = () => true;

  return service.connect()
    .then(() => service.connect())
    .then(() => assert.equal(socketCount, 1, 'only creates one socket'));
});

test('channel (when connected)', function(assert) {
  let service = this.subject();
  let socket = new MockSocket();
  let name = 'test-name';
  let params = { test: true };

  service.createSocket = () => socket;

  return service.connect()
    .then(() => service.channel(name, params))
    .then(channel => {
      assert.equal(channel.name, name, 'passed name to channel constructor');
      assert.equal(channel.params, params, 'passed params to channel constructor');
      assert.equal(channel._socket, socket, 'passed the socket to channel constructor');
    });
});

test('channel (when unconnected)', function(assert) {
  let service = this.subject();

  assert.throws(
    () => service.channel('test', {}),
    new Error('Must connect before joining a channel (test)'),
    'threw a helpful error'
  );
});

test('push (when channel has been joined)', function(assert) {
  let service = this.subject();
  let socket = new MockSocket();
  let channel = {};
  let name = 'test-channel';
  let message = 'test-message';
  let data = {};

  service.createSocket = () => socket;
  service.createChannel = () => channel;

  channel.push = (m, d) => {
    assert.equal(m, message, 'called push on the channel with the message');
    assert.equal(d, data, 'called push on the channel with the data');
  };

  return service.connect()
    .then(() => service.channel(name))
    .then(() => service.push(name, message, data));
});

test('push (when channel has not been joined)', function(assert) {
  let service = this.subject();
  let socket = new MockSocket();

  service.createSocket = () => socket;

  return service.connect()
    .then(() => {
      assert.throws(
        () => service.push('test-channel', 'test-message', { test: 'data' }),
        new Error('channel has not been joined (test-channel)'),
        'threw a helpful error'
      );
    });
});

test('push (when unconnected)', function(assert) {
  let service = this.subject();

  assert.throws(
    () => service.push('test-channel', 'test-message', { test: 'data' }),
    new Error('channel has not been joined (test-channel)'),
    'threw a helpful error'
  );
});

test('request (when channel has been joined)', function(assert) {
  let service = this.subject();
  let socket = new MockSocket();
  let channel = {};
  let name = 'test-channel';
  let message = 'test-message';
  let data = {};

  service.createSocket = () => socket;
  service.createChannel = () => channel;

  channel.request = (m, d) => {
    assert.equal(m, message, 'called request on the channel with the message');
    assert.equal(d, data, 'called request on the channel with the data');
  };

  return service.connect()
    .then(() => service.channel(name))
    .then(() => service.request(name, message, data));
});

test('request (when channel has not been joined)', function(assert) {
  let service = this.subject();
  let socket = new MockSocket();

  service.createSocket = () => socket;

  return service.connect()
    .then(() => service.request('test-channel', 'test-message', { test: 'data' }))
    .then(() => assert.ok(false, 'resolved when it should have rejected'))
    .catch(error => assert.equal(error.message, 'channel has not been joined (test-channel)', 'rejected with a helpful error'));
});

test('request (when unconnected)', function(assert) {
  let service = this.subject();

  return service.request('test-channel', 'test-message', { test: 'data' })
    .then(() => assert.ok(false, 'resolved when it should have rejected'))
    .catch(error => assert.equal(error.message, 'channel has not been joined (test-channel)', 'rejected with a helpful error'));
});

test('leaveChannel (when channel has been joined)', function(assert) {
  let service = this.subject();
  let socket = new MockSocket();
  let channel = {};
  let left = false;

  service.createSocket = () => socket;
  service.createChannel = () => channel;

  channel.leave = () => left = true;

  return service.connect()
    .then(() => service.channel(name))
    .then(() => service.leaveChannel(name))
    .then(() => assert.ok(left, 'called leave on the channel'));
});

test('leaveChannel (when channel has not been joined)', function(assert) {
  let service = this.subject();
  let socket = new MockSocket();

  service.createSocket = () => socket;

  return service.connect()
    .then(() => service.leaveChannel(name))
    .then(() => assert.ok('does not reject'));
});

test('leaveChannel (when unconnected)', function(assert) {
  let service = this.subject();

  return service.leaveChannel(name)
    .then(() => assert.ok('does not reject'));
});

test('state (lifecycle)', function(assert) {
  let service = this.subject();
  let socket = new MockSocket();

  service.createSocket = () => socket;

  socket.connect = () => {};

  assert.equal(service.get('state'), 'closed');
  service.connect();
  assert.equal(service.get('state'), 'connecting');
  socket.trigger('open');
  assert.equal(service.get('state'), 'open');
  socket.trigger('close');
  assert.equal(service.get('state'), 'closed');
});
