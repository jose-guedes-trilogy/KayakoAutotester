import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

import modalStyles from 'frontend-cp/components/ko-modal/styles';

app('Acceptance | admin/integrations/api/oauth-apps/edit', {
  beforeEach() {
    const role = server.create('role', { type: 'ADMIN' });
    const en = server.create('locale', { id: 1, locale: 'en-us', name: 'English', is_public: true, is_localized: true });
    const user = server.create('user', { role, locale: en, time_zone: 'Europe/London' });
    const session = server.create('session', { user });

    server.create('plan', { limits: {}, features: [], account_id: '123', subscription_id: '123' });

    server.create('oauth-client', {
      id: 1,
      name: 'Sample OAuth App',
      url: 'http://example.com',
      description: 'OAuth client for tests',
      logo: { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/MicroQR_Example.png' },
      key: '039be143-35a7-4cf6-9921-751c7cc7482f',
      scopes: ['users', 'configuration:read']
    });

    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('editing an OAuth app', function (assert) {
  visit('/admin/integrations/api/oauth-apps/1');
  andThen(() => {
    assert.equal($('.qa-oauth-apps-edit-key').length, 1, 'key is shown');
    assert.equal($('.qa-oauth-apps-edit-logo-image').length, 1, 'logo is shown');
    assert.equal($('.qa-oauth-apps-edit-logo-button').text().trim(), 'Change', 'logo button is "Change"');
    assert.equal($('.qa-oauth-apps-edit-key').length, 1, 'key is shown');
    assert.equal($('.qa-oauth-apps-edit-secret').length, 0, 'secret is not shown');
    assert.equal($('.qa-oauth-apps-edit-scopes-mode').text().trim(), 'Specified scopes', 'specific scopes selected');
  });
  andThen(() => {
    fillIn('.qa-oauth-apps-edit-name', 'Another name');
    click('button[type=submit]');
  });
  andThen(() => assert.equal(currentURL(), '/admin/integrations/api/oauth-apps', 'redirected to index'));
});

test('deleting an OAuth app', function (assert) {
  visit('/admin/integrations/api/oauth-apps/1');
  andThen(() => click('button:contains("Delete")'));
  andThen(() => assert.equal($(`.${modalStyles.content}`).length, 1, 'confirmation modal opened'));
  andThen(() => click('.qa-ko-confirm-modal__confirm'));
  andThen(() => assert.equal(currentURL(), '/admin/integrations/api/oauth-apps', 'redirected to index'));
});
