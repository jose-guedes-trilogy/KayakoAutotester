import { moduleForComponent, test } from 'ember-qunit';
import wait from 'ember-test-helpers/wait';
import { click, fillIn } from 'ember-native-dom-helpers';
import hbs from 'htmlbars-inline-precompile';
import { startMirage } from 'frontend-cp/initializers/ember-cli-mirage';
import rel from 'frontend-cp/mirage/utils/rel';
import { run } from '@ember/runloop';
import EN_US_STRINGS from 'frontend-cp/locales/en-us';
import cloneDeep from 'npm:lodash/cloneDeep';
import { getOwner } from '@ember/application';

/*
  Hello 👋

  This is a *literal* integration test.

  Rather than testing ko-merge-conversation-modal in isolation, it tests the
  subsystem composed of:

  - services/merge-conversation
  - components/ko-merge-conversation-modal
  - components/ko-universal-search
  - the store and associated models, adapters, and serializers

  Why opt for this style of test?

  Well, the fact is ko-merge-conversation-modal doesn’t have an API surface as
  far as other application code is concerned. It is wholly driven by
  interacting with the service. You could call this pattern “singleton service
  component”, although it’s not very catchy.

  What this test attempts to do is document **how application code interacts
  with the merge-conversation subsystem**, and where the responsibilities lie.
  For example, when a merge is complete the modal simply disappears and it is
  up to the calling code to decide what to do next.
*/

moduleForComponent('ko-merge-conversation-modal', {
  integration: true,

  beforeEach() {
    this.server = startMirage();
    this.service = getOwner(this).lookup('service:merge-conversation');

    setupIntl(this);
    setupMirage(this);
    setupStore(this);
  },

  afterEach() {
    this.server.shutdown();
  }
});

// Tests ----------------------------------------------------------------------

test('selecting and merging cases', async function(assert) {
  this.render(hbs`
    <div id="modals"></div>
    {{ko-merge-conversation-modal}}
  `);

  assert.equal(
    this.$().text().trim(),
    '',
    'renders nothing initially');

  let store = getOwner(this).lookup('service:store');
  let currentCase = store.peekRecord('case', 'primary-case');
  let promise = run(() => this.service.confirm({ currentCase }));

  await wait();
  await click('button[title="Select “Suggested Case”"]');
  await fillIn('input[type="search"]', 'Findable Case');
  await click('button[title="Select “Findable Case”"]');
  await click('.qa-ko-merge-conversation-modal__next');
  await click('.qa-ko-merge-conversation-modal__confirm');

  let result = await promise;
  let request = this.server.pretender.handledRequests.get('lastObject');

  assert.equal(
    request.url,
    '/api/v1/cases/primary-case/merge',
    'makes a POST request to /api/v1/cases/primary-case/merge');
  assert.equal(
    request.requestBody,
    '{"case_ids":"suggested-case,findable-case"}',
    'with case_ids: "suggested-case,findable-case"');
  assert.equal(
    this.$().text().trim(),
    '',
    'modal disappears');
  assert.equal(
    result.get('id'),
    'primary-case',
    'resolves with the primary case');
});

test('encountering a failure when merging', async function(assert) {
  this.render(hbs`
    <div id="modals"></div>
    {{ko-merge-conversation-modal}}
  `);

  let store = getOwner(this).lookup('service:store');
  let currentCase = store.peekRecord('case', 'primary-case');
  let promise = run(() => this.service.confirm({ currentCase }));

  await wait();
  await click('button[title="Select “Suggested Case”"]');
  await fillIn('input[type="search"]', 'Findable Case');
  await click('button[title="Select “Findable Case”"]');
  await click('.qa-ko-merge-conversation-modal__next');

  this.server.post('/api/v1/cases/primary-case/merge', {
    status: 422,
    errors: [{
      code: 'NOT_ALLOWED',
      message: 'You are not allowed to do that for some reason',
      more_info: 'https://example.com'
    }]
  }, 422);

  await click('.qa-ko-merge-conversation-modal__confirm');

  try {
    await promise;
    assert.ok(
      false,
      'should not resolve');
  } catch(error) {
    assert.equal(
      this.$().text().trim(),
      '',
      'modal disappears');
    assert.equal(
      error,
      false,
      'rejects with undefined');
  }
});

test('passing `cases` to the service', async function(assert) {
  this.render(hbs`
    <div id="modals"></div>
    {{ko-merge-conversation-modal}}
  `);

  let cases = preloadAllCases(this);
  let promise = run(() => this.service.confirm({ cases }));

  await wait();
  await click('.qa-ko-merge-conversation-modal__next');
  await click('.qa-ko-merge-conversation-modal__confirm');

  let result = await promise;
  let request = this.server.pretender.handledRequests.get('lastObject');

  assert.equal(
    request.url,
    '/api/v1/cases/primary-case/merge',
    'makes a POST request to /api/v1/cases/primary-case/merge');
  assert.equal(
    request.requestBody,
    '{"case_ids":"suggested-case,findable-case"}',
    'with case_ids: "suggested-case,findable-case"');
  assert.equal(
    this.$().text().trim(),
    '',
    'modal disappears');
  assert.equal(
    result.get('id'),
    'primary-case',
    'resolves with the primary case');
});

test('passing `skipSelection` to the service', async function(assert) {
  this.render(hbs`
    <div id="modals"></div>
    {{ko-merge-conversation-modal}}
  `);

  let cases = preloadAllCases(this);
  let skipSelection = true;
  let promise = run(() => this.service.confirm({ cases, skipSelection }));

  await wait();
  await click('.qa-ko-merge-conversation-modal__confirm');

  let result = await promise;
  let request = this.server.pretender.handledRequests.get('lastObject');

  assert.equal(
    request.url,
    '/api/v1/cases/primary-case/merge',
    'makes a POST request to /api/v1/cases/primary-case/merge');
  assert.equal(
    request.requestBody,
    '{"case_ids":"suggested-case,findable-case"}',
    'with case_ids: "suggested-case,findable-case"');
  assert.equal(
    this.$().text().trim(),
    '',
    'modal disappears');
  assert.equal(
    result.get('id'),
    'primary-case',
    'resolves with the primary case');
});

// Helpers --------------------------------------------------------------------

function setupIntl(context) {
  let intl = context.container.lookup('service:intl');
  let store = context.container.lookup('service:store');

  intl.setLocale('en-us');
  intl.addTranslations('en-us', EN_US_STRINGS);

  store.pushPayload({
    resource: 'locale',
    data: {
      type: 'locale',
      id: 1,
      attributes: {
        locale: 'en-us'
      }
    }
  });
}

function setupMirage(context) {
  let { server } = context;

  let primaryUser = server.create('user', {
    id: 'primary-user',
    full_name: 'Primary User'
  });

  let auxiliaryUser = server.create('user', {
    id: 'auxiliary-user',
    full_name: 'Auxiliary User'
  });

  server.create('case', {
    id: 'primary-case',
    subject: 'Primary Case',
    created_at: '2017-01-01T00:00:00Z',
    requester: rel(primaryUser)
  });

  server.create('case', {
    id: 'suggested-case',
    subject: 'Suggested Case',
    created_at: '2017-01-01T01:00:00Z',
    requester: rel(primaryUser)
  });

  server.create('case', {
    id: 'findable-case',
    subject: 'Findable Case',
    created_at: '2017-01-01T02:00:00Z',
    requester: rel(auxiliaryUser)
  });
}

function setupStore(context) {
  let store = context.container.lookup('service:store');
  let primaryUser = context.server.db.users.find('primary-user');
  let primaryCase = context.server.db.cases.find('primary-case');

  run(() => {
    store.pushPayload({
      resource: 'user',
      data: cloneDeep(primaryUser)
    });
    store.pushPayload({
      resource: 'case',
      data: cloneDeep(primaryCase)
    });
  });
}

function preloadAllCases(context) {
  let store = context.container.lookup('service:store');
  let { db } = context.server;

  return db.cases.map(kase => {
    let user = db.users.find(kase.requester.id);

    run(() => {
      store.pushPayload({ resource: 'user', data: cloneDeep(user) });
      store.pushPayload({ resource: 'case', data: cloneDeep(kase) });
    });

    return store.peekRecord('case', kase.id);
  });
}
