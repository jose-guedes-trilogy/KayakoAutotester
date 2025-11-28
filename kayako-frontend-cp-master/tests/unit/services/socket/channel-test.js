import { module, test } from 'qunit';
import MockSocket from 'frontend-cp/tests/helpers/mocks/socket';
import MockChannel from 'frontend-cp/tests/helpers/mocks/channel';
import { next } from '@ember/runloop';
import Channel from 'frontend-cp/services/socket/channel';

module('Unit | socket/channel');

test('join listens to presence events', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let name = 'test-channel';
  let params = {};
  let subscribedToPresenceState = false;
  let subscribedToPresenceDiff = false;

  mockSocket.channel = (n, p) => {
    assert.equal(n, name, 'passed name to socket.channel');
    assert.equal(p, params, 'passed params to socket.channel');
    return mockChannel;
  };

  mockChannel.on = event => {
    if (event === 'presence_state') { subscribedToPresenceState = true; }
    if (event === 'presence_diff') { subscribedToPresenceDiff = true; }
  };

  let channel = Channel.create({ _socket: mockSocket, name, params });
  channel.join();

  assert.ok(subscribedToPresenceState, 'subscribed to presence_state');
  assert.ok(subscribedToPresenceDiff, 'subscribed to presence_diff');
});

test('join (when channel emits "ok")', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let data = { test: 'yes' };

  mockSocket.channel = () => mockChannel;

  mockChannel.join = () => {
    next(() => mockChannel.emit('ok', data));
    return mockChannel;
  };

  let channel = Channel.create({ _socket: mockSocket });

  return channel.join()
    .then(() => assert.ok(true, 'resolved'))
    .then(() => assert.deepEqual(channel.get('data'), data, 'made data available via a prop'));
});

test('join (when channel emits "error")', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let error = { test: 'yes' };

  mockSocket.channel = () => mockChannel;

  mockChannel.join = () => {
    next(() => mockChannel.emit('error', error));
    return mockChannel;
  };

  let channel = Channel.create({ _socket: mockSocket });

  return channel.join()
    .then(() => assert.ok(false, 'resolved when it should have rejected'))
    .catch(e => assert.equal(e, error, 'rejected with error'));
});

test('join (when channel emits "timeout")', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();

  mockSocket.channel = () => mockChannel;

  mockChannel.join = () => {
    next(() => mockChannel.emit('timeout'));
    return mockChannel;
  };

  let channel = Channel.create({ _socket: mockSocket });

  return channel.join()
    .then(() => assert.ok(false, 'resolved when it should have rejected'))
    .catch(() => assert.ok(true, 'rejected with error'));
});

test('leave (when channel emits "ok")', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let data = {};

  mockSocket.channel = () => mockChannel;

  mockChannel.leave = () => {
    next(() => mockChannel.emit('ok', data));
    return mockChannel;
  };

  let channel = Channel.create({ _socket: mockSocket });

  return channel.join()
    .then(() => channel.leave())
    .then(d => assert.equal(d, data, 'resolved with data'));
});

test('leave (when channel emits "error")', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let error = {};

  mockSocket.channel = () => mockChannel;

  mockChannel.leave = () => {
    next(() => mockChannel.emit('error', error));
    return mockChannel;
  };

  let channel = Channel.create({ _socket: mockSocket });

  return channel.join()
    .then(() => channel.leave())
    .then(() => assert.ok(false, 'resolved when it should have rejected'))
    .catch(e => assert.equal(e, error, 'rejected with data'));
});

test('leave (when channel emits "timeout")', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();

  mockSocket.channel = () => mockChannel;

  mockChannel.leave = () => {
    next(() => mockChannel.emit('timeout'));
    return mockChannel;
  };

  let channel = Channel.create({ _socket: mockSocket });

  return channel.join()
    .then(() => channel.leave())
    .then(() => assert.ok(false, 'resolved when it should have rejected'))
    .catch(() => assert.ok(true, 'rejected'));
});

test('onMemberJoined', function(assert) {
  let mockSocket = new MockSocket();
  let channel = Channel.create({ _socket: mockSocket });
  let expected = 'test-id';
  let received;

  channel.on('presence-joined', id => received = id);

  channel.onMemberJoined('test-id', expected);

  assert.equal(received, expected, 'triggered the "presence-joined" event via Ember.Evented');
});

test('onMemberLeft', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = Channel.create({ _socket: mockSocket });
  let expected = 'test-id';
  let received;

  mockChannel.on('presence-left', id => received = id);

  mockChannel.onMemberLeft('test-id', expected);

  assert.equal(received, expected, 'triggered the "presence-left" event via Ember.Evented');
});

test('request (when channel emits "ok")', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let message = 'test-message';
  let data = { test: 'data' };
  let response = { ok: 'yup' };

  mockSocket.channel = () => mockChannel;

  mockChannel.push = (m, d) => {
    assert.equal(m, message, 'called channel.push with message');
    assert.equal(d, data, 'called channel.push with data');

    next(() => mockChannel.emit('ok', response));

    return mockChannel;
  };

  let channel = Channel.create({ _socket: mockSocket });

  return channel.join()
    .then(() => channel.request(message, data))
    .then(d => assert.equal(d, response, 'resolved with response'));
});

test('request (when channel emits "error")', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let message = 'test-message';
  let data = { test: 'data' };
  let error = { error: 'reason' };

  mockSocket.channel = () => mockChannel;

  mockChannel.push = () => {
    next(() => mockChannel.emit('error', error));

    return mockChannel;
  };

  let channel = Channel.create({ _socket: mockSocket });

  return channel.join()
    .then(() => channel.request(message, data))
    .then(() => assert.ok(false, 'resolved when it should have rejected'))
    .catch(e => assert.equal(e, error, 'rejected with error'));
});

test('request (when channel emits "timeout")', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let message = 'test-message';
  let data = { test: 'data' };

  mockSocket.channel = () => mockChannel;

  mockChannel.push = () => {
    next(() => mockChannel.emit('timeout'));

    return mockChannel;
  };

  let channel = Channel.create({ _socket: mockSocket });

  return channel.join()
    .then(() => channel.request(message, data))
    .then(() => assert.ok(false, 'resolved when it should have rejected'))
    .catch(() => assert.ok(true, 'rejected with error'));
});

test('push', function(assert) {
  assert.expect(2);

  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let message = 'test-message';
  let data = { test: 'data' };

  mockSocket.channel = () => mockChannel;

  mockChannel.push = (m, d) => {
    assert.equal(m, message, 'called channel.push with message');
    assert.equal(d, data, 'called channel.push with data');

    return mockChannel;
  };

  let channel = Channel.create({ _socket: mockSocket });

  return channel.join()
    .then(() => channel.push(message, data));
});

test('push (when channel emits "error")', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let message = 'test-message';
  let data = { test: 'data' };
  let error = new Error('test error');

  mockSocket.channel = () => mockChannel;

  let channel = Channel.create({ _socket: mockSocket });

  return channel.join()
    .then(() => {
      channel.push(message, data);

      assert.throws(
        () => mockChannel.emit('error', error),
        error,
        'threw an error'
      );
    });
});

test('on (with a non-presence event)', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let name = 'test-event';
  let receivedData, receivedChannel;
  let expectedData = 'test-data';

  mockSocket.channel = () => mockChannel;

  let channel = Channel.create({ _socket: mockSocket });
  channel.join();

  channel.on(name, (d, c) => {
    receivedData = d;
    receivedChannel = c;
  });

  mockChannel.trigger(name, expectedData);

  assert.equal(receivedData, expectedData, 'sends the event out via Ember.Evented');
  assert.equal(receivedChannel, channel, 'sends the channel object along with the data');
});

test('on (with a presence event)', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let name = 'presence-test';

  mockSocket.channel = () => mockChannel;

  let channel = Channel.create({ _socket: mockSocket });
  channel.join();

  mockChannel.on = () => assert.ok(false, 'called channel.on when it shouldn’t have');

  channel.on(name);

  assert.ok(true, 'appeared to do nothing');
});

test('off (with a non-presence event)', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let name = 'test-event';

  mockSocket.channel = () => mockChannel;

  let channel = Channel.create({ _socket: mockSocket });
  channel.join();

  mockChannel.off = n => assert.equal(n, name, 'called channel.off with name');

  channel.off(name);
});

test('off (with a presence event)', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();
  let name = 'presence-test';

  mockSocket.channel = () => mockChannel;

  let channel = Channel.create({ _socket: mockSocket });
  channel.join();

  mockChannel.off = () => assert.ok(false, 'called channel.off when it shouldn’t have');

  channel.off(name);

  assert.ok(true, 'appeared to do nothing');
});

test('locking / unlocking reference counts', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();

  mockSocket.channel = () => mockChannel;

  let channel = Channel.create({ _socket: mockSocket });

  let didLeave = false;
  mockChannel.leave = () => {
    didLeave = true;
    const receiveChain = { receive: () => receiveChain };
    return receiveChain;
  };

  channel.lock().join();
  channel.lock().join();

  channel.unlock();
  assert.ok(!didLeave, 'did not leave the channel');

  channel.unlock();
  assert.ok(didLeave, 'left the channel');
});

test('Asserts when unlocking an unlocked channel', function(assert) {
  let mockSocket = new MockSocket();
  let mockChannel = new MockChannel();

  mockSocket.channel = () => mockChannel;

  let channel = Channel.create({ _socket: mockSocket, name: 'foo' });

  assert.throws(
    () => channel.unlock(),
    new Error('Assertion Failed: Channel is not locked (foo)'),
    'threw an error'
  );
});
