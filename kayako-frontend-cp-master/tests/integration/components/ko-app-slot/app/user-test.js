import EmberObject from '@ember/object';
import Evented from '@ember/object/evented';
import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { next } from '@ember/runloop';
import startMirage from 'frontend-cp/tests/helpers/setup-mirage-for-integration';
import stableJSON from 'npm:json-stable-stringify';

moduleForComponent('ko-app-slot/app', 'Integration | Component | ko-app-slot/app | user page', {
  integration: true,
  beforeEach() {
    startMirage(this.container);

    const stubProcess = EmberObject.create({
      state: EmberObject.extend(Evented).create()
    });

    const processManagerStub = Service.extend({
      stubProcess: stubProcess,
      getOrCreateProcess() {
        return this.get('stubProcess');
      }
    });

    this.register('service:process-manager', processManagerStub);
    this.inject.service('process-manager', { as: 'processManager' });
  },
  afterEach() {
    window.server.shutdown();
  }
});

const DUMMY_SLOT = EmberObject.create({
  location: 'user-sidebar',
  url: `${window.location.origin}/test-assets/app.html`
});

const DUMMY_APP = EmberObject.create({
  name: 'Some App'
});

// BEGIN HELPERS
function iframeWindow(context) {
  const frame = context.$('iframe')[0];
  return frame && frame.contentWindow;
}

function nextUntil(check, done) {
  if (check()) {
    done();
  } else {
    next(() => nextUntil(check, done));
  }
}
// END HELPERS

test('Responds to get_data events for top level user', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);
  this.set('user', EmberObject.create({
    id: 123,
    fullName: 'Bob Bobbington',
    primaryEmail: EmberObject.create({ email: 'bob@bobbington.com' })
  }));

  assert.expect(3);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      slot=slot
      user=user
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const messageRef = 1;

    // 2. ACK reply from host -> client
    port.onmessage = (e) => {
      if (e.data.ref === messageRef) {
        assert.equal(e.data.event, 'reply', 'reply is sent to the correct message reference');
        assert.equal(e.data.payload.status, 'ok', 'reply is sent as ok');
        assert.equal(stableJSON(e.data.payload.data), stableJSON({
          id: 123,
          fullName: 'Bob Bobbington',
          email: 'bob@bobbington.com'
        }), 'replied with user');
        done();
      }
    };

    // 1. Client.js triggers get_data event
    port.postMessage({ event: 'get_data', payload: { path: 'user' }, ref: messageRef });
  };
});

test('Sends change event when subscribed data changes', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);

  this.set('user', EmberObject.create({
    id: 123,
    fullName: 'Bob Bobbington',
    primaryEmail: EmberObject.create({ email: 'bob@bobbington.com' })
  }));

  assert.expect(1);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      slot=slot
      user=user
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const subscribeMessageRef = 1;
    let subscriptionRef;

    port.onmessage = (e) => {
      // 2. received ACK for subscription
      if (e.data.ref === subscribeMessageRef) {
        subscriptionRef = e.data.payload.subscription;

        // 3. trigger a change
        this.get('user').set('fullName', 'Ted Teddington');
        this.get('processManager.stubProcess.state').trigger('updated');
      }

      // 4. received change event with updated data
      if (e.data.event === 'event' && e.data.payload.subscription === subscriptionRef) {
        assert.equal(stableJSON(e.data.payload.data), stableJSON({
          id: 123,
          fullName: 'Ted Teddington',
          email: 'bob@bobbington.com'
        }), 'received change event with updated data');
        done();
      }
    };

    // 1. Client.js triggers subscription
    port.postMessage({ event: 'add_event_listener', payload: { type: 'change', path: 'user' }, ref: subscribeMessageRef });

  };
});

test('Changing the user re-initializes the iframe', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);

  assert.expect(2);

  const done = assert.async(2);

  this.set('user', EmberObject.create({ id: 123 }));

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      user=user
      slot=slot
    }}
  `);

  // brand the iframe so we can check it has reloaded later
  iframeWindow(this)._IS_ORIGINAL = true;

  const originalBufferedOnMessage = iframeWindow(this).bufferedOnMessage;

  iframeWindow(this).bufferedOnMessage = (e) => {
    assert.equal(e.data.event, 'setup', 'iframe received setup message');
    done();

    this.set('user', EmberObject.create({ id: 234 }));

    nextUntil(() => !iframeWindow(this)._IS_ORIGINAL, ()  => {
      iframeWindow(this).bufferedOnMessage = (e) => {
        assert.equal(e.data.event, 'setup', 'new iframe received setup message');
        done();
        // Reset to original to avoid further calls
        iframeWindow(this).bufferedOnMessage = originalBufferedOnMessage;
      };
    });
  };
});

test('Changing the user tears down any listeners', function(assert) {

  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);

  assert.expect(2);

  const done = assert.async(1);

  this.set('user', EmberObject.create({ id: 123 }));

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      user=user
      slot=slot
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const subscriptionRef = 123;

    port.onmessage = (e) => {
      // 2. received ACK for subscription
      if (e.data.ref === subscriptionRef) {

        assert.ok(this.get('processManager.stubProcess.state').has('updated'), 'has change listener');

        // 3. change the user
        this.set('user', EmberObject.create({ id: 234 }));

        assert.ok(!this.get('processManager.stubProcess.state').has('updated'), 'has torn down change listener');

        done();
      }
    };

    // 1. setup the event listener
    port.postMessage({ event: 'add_event_listener', payload: { type: 'change', path: 'user' }, ref: subscriptionRef });
  };

});
