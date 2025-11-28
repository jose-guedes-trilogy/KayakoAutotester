import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';
import modalStyles from 'frontend-cp/components/ko-modal/styles';

app('Acceptance | admin/manage/facebook/pages', {
  beforeEach() {
    /*eslint-disable quote-props*/
    server.create('locale', {
      locale: 'en-us',
      isDefault: true
    });

    const businesshour = server.create('business-hour', { title: 'Default Business Hours' });
    const salesTeam = server.create('team', { title: 'Sales', businesshour: businesshour });
    const agentRole = server.create('role', { type: 'AGENT' });
    const locale = server.create('locale', { locale: 'en-us' });

    server.create('user', { teams: [salesTeam], role: agentRole, full_name: 'Leeroy Jenkins', locale: locale, time_zone: 'Europe/London' });
    server.create('case-status', { label: 'New' });
    server.create('case-type', { label: 'Question' });
    server.create('case-priority', { label: 'Low' });
    server.create('facebook-page');

    const adminRole = server.create('role', { type: 'ADMIN' });
    const agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });

    login(session.id);

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    /*eslint-enable quote-props*/
  },

  afterEach() {
    logout();
  }
});

test('deleting a facebook page', function(assert) {
  visit('/admin/channels/facebook');

  andThen(function() {
    triggerEvent(`.${rowStyles.row}:first`, 'mouseenter');
    click('.qa-admin-facebook-page__delete');
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(find('.qa-admin-facebook-page').length, 0);
  });
});
