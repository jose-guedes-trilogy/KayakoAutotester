import EmberObject from '@ember/object';
import { moduleFor, test } from 'ember-qunit';
import MockLocalStore from 'frontend-cp/tests/helpers/mock-local-store';
import MockRouting from 'frontend-cp/tests/helpers/mock-routing';

function schedulePersistTabs() {
  return this.persistTabs();
}

const fakeProcessManager = {
  getOrCreateProcess() {
    return { pid: 'cheese' };
  }
};

moduleFor('service:tab-store', 'Unit | Service | tab store', {
  integration: true,

  beforeEach() {
    this.register('service:metrics', {});
    this.register('service:url', {});
  }
});

test('createTab', function(assert) {
  let routing = new MockRouting('test/test');
  let localStore = new MockLocalStore();
  let routeName = 'test.route.name';
  let model = EmberObject.create({ id: 'test-id' });
  let service = this.subject({ routing, localStore, schedulePersistTabs, processManager: fakeProcessManager });

  service.createTab(routeName, model, { param: 'value' });

  assert.deepEqual(localStore.stored, {
    core: {
      tabs: [{
        basePath: 'test/test',
        dynamicSegments: ['test-id'],
        processId: 'cheese',
        queryParams: { param: 'value' },
        routeName: 'test.route.name',
        state: {}
      }]
    }
  }, 'it stores the expected struture in localStore');
});

test('createTabWithFullyLoadedModel', function(assert) {
  let hasReloaded = false;
  let routing = new MockRouting('test/test');
  let localStore = new MockLocalStore();
  let routeName = 'test.route.name';
  let model = EmberObject.extend({
    reload() {
      hasReloaded = true;
    }
  }).create({ id: 'test-id', _isFullyLoaded: true });
  let service = this.subject({ routing, localStore, schedulePersistTabs, processManager: fakeProcessManager });

  service.createTab(routeName, model);

  assert.notOk(hasReloaded, 'should not have reloaded a partial model');
});

test('createTabWithPartialyLoadedModel', function(assert) {
  let hasReloaded = false;
  let routing = new MockRouting('test/test');
  let localStore = new MockLocalStore();
  let routeName = 'test.route.name';
  let model = EmberObject.extend({
    reload() {
      hasReloaded = true;
    }
  }).create({ id: 'test-id', _isFullyLoaded: false });
  let service = this.subject({ routing, localStore, schedulePersistTabs, processManager: fakeProcessManager });

  service.createTab(routeName, model);

  assert.ok(hasReloaded, 'should have reloaded a partial model');
});

test('open', function(assert) {
  let routing = new MockRouting('test/test');
  let localStore = new MockLocalStore();
  let service = this.subject({ routing, localStore, schedulePersistTabs });
  let transition = {
    handlerInfos: [{ name: 'test.route.name' }],
    queryParams: {},
    params: {},
    resolveIndex: 0,
    intent: {
      contexts: ['test-id']
    }
  };

  let tab = service.open(transition);

  // tabs need a process to serialize
  service.update(tab, { process: { pid: 'fake-process' }});

  assert.deepEqual(localStore.stored, {
    core: {
      tabs: [{
        basePath: 'test/test',
        dynamicSegments: ['test-id'],
        queryParams: null,
        routeName: 'test.route.name',
        state: {},
        processId: 'fake-process'
      }]
    }
  }, 'it stores the expected struture in localStore');
});
