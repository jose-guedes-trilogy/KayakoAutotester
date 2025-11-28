import { getOwner } from '@ember/application';
import { moduleFor, test } from 'ember-qunit';
import mirage from 'frontend-cp/tests/helpers/setup-mirage-for-integration';

moduleFor('service:plan', 'Unit | Service | plan', {
  integration: true,

  setup: function() {
    /* eslint-disable no-undef, camelcase */
    mirage(getOwner(this));
    const limit = server.create('plan-limit', {
      collaborators: 10
    });

    const feature = server.create('feature', {
      code: 'collaborators',
      name: 'collaborators',
      description: 'People who may log in as a team member'
    });

    server.create('plan', { limits: limit, features: [feature], account_id: '123', subscription_id: '123' });

    /* eslint-enable no-undef, camelcase */
  }
});

test('it should return the limit for the name requested', function(assert) {
  assert.expect(1);

  let service = getOwner(this).lookup('service:plan');
  return service.fetchPlan().then(() => {
    assert.equal(service.limitFor('collaborators'), 10);
  });
});

test('it should return true if the name of the feature is present', function(assert) {
  assert.expect(1);

  let service = getOwner(this).lookup('service:plan');
  return service.fetchPlan().then(() => {
    assert.equal(service.has('collaborators'), true);
  });
});

test('it will fetch from the server and update', function(assert) {
  assert.expect(5);

  let service = getOwner(this).lookup('service:plan');
  service.fetchPlan().then(() => {
    assert.equal(service.limitFor('collaborators'), 10);
    assert.equal(service.has('collaborators'), true);
    assert.equal(service.has('agents'), false);
  });

  /* eslint-disable no-undef, camelcase */
  const limit = server.create('plan-limit', {
    agents: 2
  });

  const feature = server.create('feature', {
    code: 'agents',
    name: 'agents',
    description: 'People who may log in and talk to customers'
  });

  server.db.plans.remove(1);

  server.create('plan', { limits: limit, features: [feature], account_id: '123', subscription_id: '123' });

  /* eslint-enable no-undef, camelcase */
  return service.fetchPlan().then(() => {
    assert.equal(service.limitFor('agents'), 2);
    assert.equal(service.has('agents'), true);
  });
});

test('it should return true for isTrial when lead id is present', function(assert) {
  assert.expect(1);
  server.create('plan', { lead_id: '100202020' });

  let service = getOwner(this).lookup('service:plan');
  return service.fetchPlan().then(() => {
    assert.equal(service.get('isTrial'), true);
  });
});

test('it should return true for isSandbox when opportunity id is present', function(assert) {
  assert.expect(1);
  server.create('plan', { opportunity_id: '100202020' });

  let service = getOwner(this).lookup('service:plan');
  return service.fetchPlan().then(() => {
    assert.equal(service.get('isSandbox'), true);
  });
});

test('it should return true for isOnDemandSandbox when plan is not grandfather and account id is missing', function(assert) {
  assert.expect(1);
  server.create('plan', { opportunity_id: '100202020', is_grandfathered: false, account_id: null});

  let service = getOwner(this).lookup('service:plan');
  return service.fetchPlan().then(() => {
    assert.equal(service.get('isOnDemandSandbox'), true);
  });
});

test('it should return true for isSandbox when is grandfathered is true', function(assert) {
  assert.expect(2);
  server.create('plan', { opportunity_id: '100202020', is_grandfathered: true, account_id: null});

  let service = getOwner(this).lookup('service:plan');
  return service.fetchPlan().then(() => {
    assert.equal(service.get('isSandbox'), true);
    assert.equal(service.get('isOnDemandSandbox'), false);
  });
});

test('it should return true for isSandbox when is account_id is set', function(assert) {
  assert.expect(2);
  server.create('plan', { opportunity_id: '100202020', is_grandfathered: false, account_id: '1020202'});

  let service = getOwner(this).lookup('service:plan');
  return service.fetchPlan().then(() => {
    assert.equal(service.get('isSandbox'), true);
    assert.equal(service.get('isOnDemandSandbox'), false);
  });
});
