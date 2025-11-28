import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';
import QUnit from 'qunit';
import rowStyles from 'frontend-cp/components/ko-admin/billing/index/styles';
import cardStyles from 'frontend-cp/components/ko-admin/billing/card/styles';

QUnit.skip('Acceptance | admin/account/billing Index', function(hooks) {
  app('Acceptance | admin/account/billing Index', {
    beforeEach() {
      /*eslint-disable camelcase*/
      const locale = server.create('locale', { locale: 'en-us' });
      server.create('plan', {limits: {}, features: [], account_id: '123', subscription_id: '123'});
      const adminRole = server.create('role', { type: 'ADMIN' });
      const agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London'});
      const session = server.create('session', { user: agent });
      login(session.id);
      server.createList('creditcard', 5);
    },

    afterEach() {
      logout();
    }
  });

  test('visiting /admin/account/billing', function(assert) {
    visit('/admin/account/billing');

    andThen(function() {
      assert.equal(currentURL(), '/admin/account/billing');
      assert.equal(find(`.${cardStyles.card}`).length, 5);
      assert.equal(find(`.${rowStyles.tile}`).length, 1);
    });
  });

  test('marking card as default', function(assert) {
    visit('/admin/account/billing');
    andThen(function() {
      click(`.${cardStyles.card}:eq(0) .${cardStyles['card-type']}`);
    });
    andThen(function() {
      assert.equal(find(`.${cardStyles.card}:eq(0) .${cardStyles['card-type']}`).hasClass(cardStyles.isDefault), true);
    });
  });

  test('remove a card', function(assert) {
    visit('/admin/account/billing');
    andThen(function() {
      click(`.${cardStyles.card}:eq(1) .${cardStyles['delete-handle']}`);
    });
    andThen(function() {
      assert.equal(find(`.${cardStyles.card}`).length, 4);
    });
  });

  test('cannot remove a default card', function(assert) {
    visit('/admin/account/billing');
    andThen(function() {
      click(`.${cardStyles.card}:eq(2) .${cardStyles['card-type']}`);
    });
    andThen(function() {
      click(`.${cardStyles.card}:eq(2) .${cardStyles['delete-handle']}`)
      .then(() => {
        assert.equal(true, false);
      })
      .catch((e) => {
        assert.equal(/Element .* not found/.test(e.message), true);
      });
    });
  });
});
