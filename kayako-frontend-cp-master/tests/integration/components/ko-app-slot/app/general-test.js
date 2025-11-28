import EmberObject from '@ember/object';
import Evented from '@ember/object/evented';
import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { next } from '@ember/runloop';
import startMirage from 'frontend-cp/tests/helpers/setup-mirage-for-integration';
import stableJSON from 'npm:json-stable-stringify';

moduleForComponent('ko-app-slot/app', 'Integration | Component | ko-app-slot/app | general', {
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DUMMY_SLOT = EmberObject.create({
  location: 'case-sidebar',
  url: `${window.location.origin}/test-assets/app.html`
});

const DUMMY_APP = EmberObject.create({
  name: 'Some App',
  id: '123'
});

const DUMMY_INSTALLATION = EmberObject.create({
  id: '234',
  app: DUMMY_APP
});

// BEGIN HELPERS
function iframeWindow(context) {
  const frame = context.$('iframe')[0];
  return frame && frame.contentWindow;
}
// END HELPERS

test('Renders the app with an iframe for the slot', function(assert) {
  const slot = EmberObject.create({
    location: 'case-sidebar',
    url: 'https://example.com'
  });

  this.set('slot', slot);
  this.set('app', EmberObject.create({}));

  this.render(hbs`
    {{ko-app-slot/app
      app=app
      slot=slot
    }}
  `);

  assert.ok(
    /^https:\/\/example.com/.test(this.$('iframe').attr('src')),
    'renders the iframe with correct source'
  );
});

test('Sets up a message channel when the iframe loads', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('installedApp', DUMMY_INSTALLATION);
  this.set('slot', DUMMY_SLOT);

  assert.expect(3);

  const done = assert.async();

  this.render(hbs`
    {{ko-app-slot/app
      installedApp=installedApp
      app=app
      slot=slot
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    assert.equal(e.data.event, 'setup', 'iframe received setup message');
    assert.ok(e.data.ref, 'received ref');
    assert.ok(e.ports[0], 'received MessagePort');
    done();
  };
});

test('Responds to unknown events with error', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('installedApp', DUMMY_INSTALLATION);
  this.set('slot', DUMMY_SLOT);

  assert.expect(4);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      installedApp=installedApp
      app=app
      slot=slot
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const messageRef = 1;

    // 3. ACK reply from host -> client
    port.onmessage = (e) => {
      if (e.data.ref === messageRef) {
        assert.equal(e.data.event, 'reply', 'reply is sent to the correct message reference');
        assert.equal(e.data.payload.status, 'error', 'reply is sent as error');
        assert.equal(e.data.payload.code, 'unknown_event', 'has the correct error code');
        assert.equal(e.data.payload.message, 'Received unknown event "foo"', 'has the correct error message');
        done();
      }
    };

    // 1. Client.js triggers invalid event
    port.postMessage({ event: 'foo', payload: {}, ref: messageRef });
  };
});

test('Responds to dimensions_changed events', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('installedApp', DUMMY_INSTALLATION);
  this.set('slot', DUMMY_SLOT);

  assert.expect(3);

  const done = assert.async(2);

  this.render(hbs`
    {{ko-app-slot/app
      installedApp=installedApp
      app=app
      slot=slot
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const messageRef = 1;

    // 3. ACK reply from host -> client
    port.onmessage = (e) => {
      if (e.data.ref === messageRef) {
        assert.equal(e.data.event, 'reply', 'reply is sent to the correct message reference');
        assert.equal(e.data.payload.status, 'ok', 'reply is sent as ok');
        done();
      }
    };

    // 1. Client.js triggers dimensions_changed event
    port.postMessage({ event: 'dimensions_changed', payload: { width: 100, height: 200 }, ref: messageRef });

    // 2. Host has resized the iframe
    next(() => {
      // don't currently set width
      // assert.equal(this.$('iframe').attr('width'), '100px', 'has set width');
      assert.equal(this.$('iframe').attr('height'), '200px', 'has set height');
      done();
    });
  };
});

test('Responds to invalid dimensions_changed events', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('installedApp', DUMMY_INSTALLATION);
  this.set('slot', DUMMY_SLOT);

  assert.expect(5);

  const done = assert.async(2);

  this.render(hbs`
    {{ko-app-slot/app
      installedApp=installedApp
      app=app
      slot=slot
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const messageRef = 1;

    // 3. ACK reply from host -> client
    port.onmessage = (e) => {
      if (e.data.ref === messageRef) {
        assert.equal(e.data.event, 'reply', 'reply is sent to the correct message reference');
        assert.equal(e.data.payload.status, 'error', 'reply is sent as error');
        assert.equal(e.data.payload.code, 'dimensions_invalid', 'has the correct error code');
        assert.equal(e.data.payload.message, 'Dimensions must be >= 0', 'has the correct error message');
        done();
      }
    };

    // 1. Client.js triggers dimensions_changed event
    port.postMessage({ event: 'dimensions_changed', payload: { width: -1, height: -1 }, ref: messageRef });

    // 2. Host has not resized the iframe
    next(() => {
      // assert.equal(this.$('iframe').attr('width'), '0px', 'has not set width');
      assert.equal(this.$('iframe').attr('height'), '0px', 'has not set height');
      done();
    });
  };
});

test('Responds to get_data events for unknown property', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('installedApp', DUMMY_INSTALLATION);
  this.set('slot', DUMMY_SLOT);

  assert.expect(3);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      installedApp=installedApp
      app=app
      slot=slot
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
        assert.equal(e.data.payload.data, undefined, 'replied with undefined as value');
        done();
      }
    };

    // 1. Client.js triggers get_data event
    port.postMessage({ event: 'get_data', payload: { path: 'foo.bar' }, ref: messageRef });
  };
});


test('Responds to add_event_listener events (type change)', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('installedApp', DUMMY_INSTALLATION);
  this.set('slot', DUMMY_SLOT);

  assert.expect(3);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      installedApp=installedApp
      app=app
      slot=slot
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
        assert.ok(UUID_REGEX.test(e.data.payload.subscription), 'replies with a subscription UUID');
        done();
      }
    };

    // 1. Client.js triggers get_data event
    port.postMessage({ event: 'add_event_listener', payload: { type: 'change', path: 'case.requestor.fullName' }, ref: messageRef });
  };
});

test('Responds to add_event_listener events (type invalid)', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('installedApp', DUMMY_INSTALLATION);
  this.set('slot', DUMMY_SLOT);

  assert.expect(4);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      installedApp=installedApp
      app=app
      slot=slot
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const messageRef = 1;

    // 2. ACK reply from host -> client
    port.onmessage = (e) => {
      if (e.data.ref === messageRef) {
        assert.equal(e.data.event, 'reply', 'reply is sent to the correct message reference');
        assert.equal(e.data.payload.status, 'error', 'reply is sent as error');
        assert.equal(e.data.payload.code, 'unknown_event_listener_type', 'has the correct error code');
        assert.equal(e.data.payload.message, 'Cannot add event listener for unknown type "foo"', 'has the correct error message');
        done();
      }
    };

    // 1. Client.js triggers get_data event
    port.postMessage({ event: 'add_event_listener', payload: { type: 'foo' }, ref: messageRef });
  };
});

test('Responds to remove_event_listener events with valid subscription ID', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('installedApp', DUMMY_INSTALLATION);
  this.set('slot', DUMMY_SLOT);

  assert.expect(2);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      installedApp=installedApp
      app=app
      slot=slot
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const subscribeMessageRef = 1;
    const unsubscribeMessageRef = 2;

    port.onmessage = (e) => {
      // 2. received ACK for subscription
      if (e.data.ref === subscribeMessageRef) {
        const subscription = e.data.payload.subscription;

        // 3. unsubscribe from subscription
        port.postMessage({ event: 'remove_event_listener', payload: { subscription }, ref: unsubscribeMessageRef });
      }

      // 4. received ACK for subscription
      if (e.data.ref === unsubscribeMessageRef) {
        assert.equal(e.data.event, 'reply', 'reply is sent to the correct message reference');
        assert.equal(e.data.payload.status, 'ok', 'reply is sent as ok');
        done();
      }
    };

    // 1. Client.js triggers subscription
    port.postMessage({ event: 'add_event_listener', payload: { type: 'change', path: 'case.requestor.fullName' }, ref: subscribeMessageRef });

  };
});


test('Responds to remove_event_listener events with invalid subscription ID', function(assert) {
  this.set('app', DUMMY_APP);
  this.set('installedApp', DUMMY_INSTALLATION);
  this.set('slot', DUMMY_SLOT);

  assert.expect(4);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      installedApp=installedApp
      app=app
      slot=slot
    }}
  `);

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const messageRef = 1;

    port.onmessage = (e) => {
      // 2. received ACK for unsubscribe
      if (e.data.ref === messageRef) {
        assert.equal(e.data.event, 'reply', 'reply is sent to the correct message reference');
        assert.equal(e.data.payload.status, 'error', 'reply is sent as error');
        assert.equal(e.data.payload.code, 'subscription_reference_invalid', 'has the correct error code');
        assert.equal(e.data.payload.message, 'No event listener found for subscription reference "some-invalid-ref"', 'has the correct error message');
        done();
      }
    };

    // 1. Client.js triggers unsubscription
    port.postMessage({ event: 'remove_event_listener', payload: { subscription: 'some-invalid-ref' }, ref: messageRef });

  };
});


test('Sends requests to API proxy with successful response', function(assert) {

  this.set('app', DUMMY_APP);
  this.set('installedApp', DUMMY_INSTALLATION);
  this.set('slot', DUMMY_SLOT);

  this.set('case', EmberObject.create({
    id: 123,
    subject: 'A Case',
    requestor: EmberObject.create({
      id: 234,
      fullName: 'Bob Bobbington'
    })
  }));

  assert.expect(4);

  const done = assert.async(1);

  this.render(hbs`
    {{ko-app-slot/app
      installedApp=installedApp
      app=app
      slot=slot
      case=case
    }}
  `);

  // 2. server receives request and responds with data from 3rd party API
  server.post('/proxy', (schema, req) => {
    const body = JSON.parse(req.requestBody);

    assert.equal(stableJSON(body), stableJSON({
      id: DUMMY_INSTALLATION.id,
      payload: {
        url: 'https://example.com/some/api',
        method: 'POST',
        data: {
          foo: 'bar'
        },
        headers: {
          'X-API-KEY': '{{some.placeholder}}'
        }
      }
    }), 'server receives correct request');

    return {
      status: 200,
      data: {
        status: 200,
        body: { some: 'data' },
        headers: { 'X-Foo': 'Some header value' }
      }
    };
  });

  iframeWindow(this).bufferedOnMessage = (e) => {
    const port = e.ports[0];
    const messageRef = 1;

    port.onmessage = (e) => {
      // 3. received request response
      if (e.data.ref === messageRef) {
        assert.equal(e.data.event, 'reply', 'reply is sent to the correct message reference');
        assert.equal(e.data.payload.status, 'ok', 'reply is sent as ok');
        assert.equal(stableJSON(e.data.payload.response), stableJSON({
          status: 200,
          body: { some: 'data' },
          headers: { 'X-Foo': 'Some header value' }
        }), 'reply includes response');

        done();
      }
    };

    // 1. Client.js triggers request
    port.postMessage({ event: 'remote_request', payload: {
      url: 'https://example.com/some/api',
      method: 'POST',
      data: {
        foo: 'bar'
      },
      headers: {
        'X-API-KEY': '{{some.placeholder}}'
      }
    }, ref: messageRef });
  };
});
