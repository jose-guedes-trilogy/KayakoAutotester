import EmberObject from '@ember/object';
import Evented from '@ember/object/evented';
import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { run, next } from '@ember/runloop';
import startMirage from 'frontend-cp/tests/helpers/setup-mirage-for-integration';
import stableJSON from 'npm:json-stable-stringify';

moduleForComponent('ko-app-slot/app', 'Integration | Component | ko-app-slot/app | case page', {
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
  location: 'case-sidebar',
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

test('Responds to get_data events for top level case', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);

  this.set('case', EmberObject.create({
    id: 123,
    subject: 'A Case',
    requestor: EmberObject.create({
      id: 234,
      fullName: 'Bob Bobbington',
      primaryEmail: EmberObject.create({ email: 'bob@bobbington.com' })
    })
  }));

  assert.expect(3);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      slot=slot
      case=case
      user=case.requestor
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
          subject: 'A Case',
          requestor: {
            id: 234,
            fullName: 'Bob Bobbington',
            email: 'bob@bobbington.com'
          }
        }), 'replied with full case');
        done();
      }
    };

    // 1. Client.js triggers get_data event
    port.postMessage({ event: 'get_data', payload: { path: 'case' }, ref: messageRef });
  };
});

test('Responds to get_data events for case requestor', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);

  this.set('case', EmberObject.create({
    id: 123,
    subject: 'A Case',
    requestor: EmberObject.create({
      id: 234,
      fullName: 'Bob Bobbington',
      primaryEmail: EmberObject.create({ email: 'bob@bobbington.com' })
    })
  }));

  assert.expect(3);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      slot=slot
      case=case
      user=case.requestor
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
          id: 234,
          fullName: 'Bob Bobbington',
          email: 'bob@bobbington.com'
        }), 'replied with case requestor');
        done();
      }
    };

    // 1. Client.js triggers get_data event
    port.postMessage({ event: 'get_data', payload: { path: 'case.requestor' }, ref: messageRef });
  };
});

test('Responds to get_data events for leaf property', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);

  this.set('case', EmberObject.create({
    id: 123,
    subject: 'A Case',
    requestor: EmberObject.create({
      id: 234,
      fullName: 'Bob Bobbington'
    })
  }));

  assert.expect(3);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      slot=slot
      case=case
      user=case.requestor
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
        assert.equal(e.data.payload.data, 'Bob Bobbington', 'replied with case requestor name');
        done();
      }
    };

    // 1. Client.js triggers get_data event
    port.postMessage({ event: 'get_data', payload: { path: 'case.requestor.fullName' }, ref: messageRef });
  };
});

test('Sends change event when subscribed data changes', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);


  this.set('case', EmberObject.create({
    id: 123,
    subject: 'A Case',
    requestor: EmberObject.create({
      id: 234,
      fullName: 'Bob Bobbington',
      primaryEmail: EmberObject.create({ email: 'bob@bobbington.com' })
    })
  }));

  assert.expect(1);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      slot=slot
      case=case
      user=case.requestor
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
        this.get('case').set('subject', 'Changed Subject');
        this.get('processManager.stubProcess.state').trigger('updated');
      }

      // 4. received change event with updated data
      if (e.data.event === 'event' && e.data.payload.subscription === subscriptionRef) {
        assert.equal(stableJSON(e.data.payload.data), stableJSON({
          id: 123,
          subject: 'Changed Subject',
          requestor: {
            id: 234,
            fullName: 'Bob Bobbington',
            email: 'bob@bobbington.com'
          }
        }), 'received change event with updated data');
        done();
      }
    };

    // 1. Client.js triggers subscription
    port.postMessage({ event: 'add_event_listener', payload: { type: 'change', path: 'case' }, ref: subscribeMessageRef });

  };
});


test('Sends change event with sub resource when subscribed data changes', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);

  this.set('case', EmberObject.create({
    id: 123,
    subject: 'A Case',
    requestor: EmberObject.create({
      id: 234,
      fullName: 'Bob Bobbington',
      primaryEmail: EmberObject.create({ email: 'bob@bobbington.com' })
    })
  }));

  assert.expect(1);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      slot=slot
      case=case
      user=case.requestor
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
        run(() => {
          this.get('case').set('requestor.fullName', 'Ted Teddington');
        });

        this.get('processManager.stubProcess.state').trigger('updated');
      }

      // 4. received change event with updated data
      if (e.data.event === 'event' && e.data.payload.subscription === subscriptionRef) {
        assert.equal(stableJSON(e.data.payload.data), stableJSON({
          id: 234,
          fullName: 'Ted Teddington',
          email: 'bob@bobbington.com'
        }), 'received change event with updated data');
        done();
      }
    };

    // 1. Client.js triggers subscription
    port.postMessage({ event: 'add_event_listener', payload: { type: 'change', path: 'case.requestor' }, ref: subscribeMessageRef });

  };
});


test('Does not send change event if sub-resource has not changed', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);

  this.set('case', EmberObject.create({
    id: 123,
    subject: 'A Case',
    requestor: EmberObject.create({
      id: 234,
      fullName: 'Bob Bobbington',
      primaryEmail: EmberObject.create({ email: 'bob@bobbington.com' })
    })
  }));

  assert.expect(1);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      slot=slot
      case=case
      user=case.requestor
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const subscribeMessageRef = 1;
    let subscriptionRef;
    let changeHappened = false;

    port.onmessage = (e) => {
      // 2. received ACK for subscription
      if (e.data.ref === subscribeMessageRef) {
        subscriptionRef = e.data.payload.subscription;

        // 3. trigger a change
        this.get('case').set('subject', 'Subject Changed');
        this.get('processManager.stubProcess.state').trigger('updated');

        // 4. wait a while to give 5 a chance
        next(() => {
          assert.notOk(changeHappened, 'should not have received change event');
          done();
        });
      }

      // 5. received change event with updated data, this should not happen
      if (e.data.event === 'event' && e.data.payload.subscription === subscriptionRef) {
        changeHappened = true;
      }
    };

    // 1. Client.js triggers subscription
    port.postMessage({ event: 'add_event_listener', payload: { type: 'change', path: 'case.requestor' }, ref: subscribeMessageRef });

  };
});

test('Changing the case re-initializes the iframe', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);

  assert.expect(2);

  const done = assert.async(2);

  this.set('case', EmberObject.create({ id: 123 }));

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      case=case
      slot=slot
    }}
  `);

  // brand the iframe so we can check it has reloaded later
  iframeWindow(this)._IS_ORIGINAL = true;
  const originalBufferedOnMessage = iframeWindow(this).bufferedOnMessage;

  iframeWindow(this).bufferedOnMessage = (e) => {
    assert.equal(e.data.event, 'setup', 'iframe received setup message');
    done();

    this.set('case', EmberObject.create({ id: 234 }));

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

test('Changing the case tears down any listeners', function(assert) {

  this.set('app', DUMMY_APP);
  this.set('slot', DUMMY_SLOT);


  assert.expect(2);

  const done = assert.async(1);

  this.set('case', EmberObject.create({ id: 123 }));

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      case=case
      slot=slot
      user=case.requestor
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const subscriptionRef = 123;

    port.onmessage = (e) => {
      // 2. received ACK for subscription
      if (e.data.ref === subscriptionRef) {

        assert.ok(this.get('processManager.stubProcess.state').has('updated'), 'has change listener');

        // 3. change the case
        this.set('case', EmberObject.create({ id: 234 }));

        assert.ok(!this.get('processManager.stubProcess.state').has('updated'), 'has torn down change listener');

        done();
      }
    };

    // 1. setup the event listener
    port.postMessage({ event: 'add_event_listener', payload: { type: 'change', path: 'case.requestor' }, ref: subscriptionRef });
  };

});
