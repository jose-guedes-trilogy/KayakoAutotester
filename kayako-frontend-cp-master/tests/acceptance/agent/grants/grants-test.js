import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

import modalStyles from 'frontend-cp/components/ko-modal/styles';

let user;

app('Acceptance | User | Manage app access', {
  beforeEach() {
    const locale = server.create('locale', { locale: 'en-us' });
    const role = server.create('role', { type: 'AGENT' });
    user = server.create('user', { role: role, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user });
    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    server.create('oauth-client', {
      id: 1,
      name: 'Android Client',
      url: 'https://play.google.com/store/apps/details?id=com.coreapps.android.kayako',
      logo: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Android_robot.svg/200px-Android_robot.svg.png',
        created_at: '2017-02-28T17:35:33+00:00'
      },
      description: 'Android Client for Kayako',
      author: 'Google',
      author_url: 'https://www.google.com/',
      created_at: '2017-02-28T17:35:33+00:00'
    });

    server.create('oauth-client', {
      id: 2,
      name: 'Tizen Client',
      url: 'http://www.tizenstore.com/apps/kayako',
      logo: {
        url: 'https://upload.wikimedia.org/wikipedia/commons/archive/6/6a/20130328205018%21Tizen_Logo.png',
        created_at: '2017-02-28T17:40:12+00:00'
      },
      description: 'Tizen Client for Kayako',
      author: 'Samsung',
      author_url: 'http://www.samsung.com/',
      created_at: '2017-02-28T17:40:12+00:00'
    });

    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('view authorized apps', function(assert) {
  visit(`/agent/users/${user.id}`);

  click('.qa-action-menu__dropdown');

  andThen(() => {
    assert.equal($('.qa-action-menu__manage-app-access').length, 1, 'Action menu item included');
    click('.qa-action-menu__manage-app-access');
  });

  andThen(() => {
    assert.equal($('.qa-user-content__my-grant').length, 2, 'Grants shown');
    assert.equal($('.qa-user-content__my-grant:eq(0) .qa-oauth-client-title').text().trim(), 'Android Client', 'First grant is valid');
    assert.equal($('.qa-user-content__my-grant:eq(1) .qa-oauth-client-title').text().trim(), 'Tizen Client', 'Second grant is valid');
    click('.qa-user-content__my-grants-close');
  });

  andThen(() => {
    assert.equal($('.qa-user-content__my-grant').length, 0, 'Grants hidden');
  });
});

test('revoke an app', function(assert) {
  visit(`/agent/users/${user.id}`);

  click('.qa-action-menu__dropdown');
  click('.qa-action-menu__manage-app-access');

  andThen(() => {
    assert.equal($('.qa-user-content__my-grant').length, 2, 'Both grants shown');
    assert.equal($('.qa-user-content__my-grant:eq(0) .qa-oauth-client-title').text().trim(), 'Android Client', 'Android Client is there');
    click('.qa-user-content__my-grant:eq(0) .qa-user-content__my-grants-revoke');
  });

  andThen(() => {
    assert.equal($(`.${modalStyles.content}`).length, 2, 'Another modal opened to confirm revocation');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(() => {
    assert.equal($('.qa-user-content__my-grant').length, 1, 'One grant removed');
    assert.equal($('.qa-user-content__my-grant:eq(0) .qa-oauth-client-title').text().trim(), 'Tizen Client', 'Only Tizen Client is there');
  });
});
