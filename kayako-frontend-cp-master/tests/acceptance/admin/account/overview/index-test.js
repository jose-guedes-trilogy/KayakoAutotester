import moduleForAcceptance from 'frontend-cp/tests/helpers/module-for-acceptance';
import { skip } from 'qunit';
import loginAsAdmin from 'frontend-cp/tests/helpers/login-as-admin';
import loadSubscriptionScenario from 'frontend-cp/mirage/scenarios/subscription';

moduleForAcceptance('Acceptance | admin/account/overview Index', {
  beforeEach() {
    loadSubscriptionScenario(server);
    server.createList('invoice', 5);
    loginAsAdmin();
  },

  afterEach() {
    logout();
  }
});

skip('visiting /admin/account/overview', function(assert) {
  visit('/admin/account/overview');

  andThen(function() {
    assert.equal(currentURL(), '/admin/account/overview');
  });
});

skip('listing invoices', function(assert) {
  visit('/admin/account/overview');

  andThen(function() {
    assert.equal(find('.invoice-item').length, 5);
  });
});
