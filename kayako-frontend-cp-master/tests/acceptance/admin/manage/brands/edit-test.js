import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

import { assertRows } from './helpers';

app('Acceptance | admin/manage/brands/edit', {
  beforeEach() {
    const en = server.create('locale', { id: 1, locale: 'en-us', name: 'English', is_public: true, is_localized: true });

    const brand = server.create('brand', { id: 1, locale: en, is_enabled: true, name: 'Default', domain: 'kayako.com', sub_domain: 'support', is_default: true });
    server.create('brand', { id: 2, locale: en, is_enabled: true, name: 'Custom Alias', domain: 'kayako.com', sub_domain: 'custom_alias', is_default: false, alias: 'example.com' });
    server.create('brand', { id: 3, locale: en, is_enabled: false, name: 'Disabled', domain: 'kayako.com', sub_domain: 'disabled', is_default: false });

    const role = server.create('role', { type: 'ADMIN' });
    const user = server.create('user', { role, locale: en, time_zone: 'Europe/London' });
    const session = server.create('session', { user });

    server.create('setting', {
      id: 'account.default_language',
      value: 'en-us'
    });

    server.create('locale', { id: 2, locale: 'fr-fr', name: 'French', is_public: true, is_localized: true });
    server.create('locale', { id: 3, locale: 'de-de', name: 'German', is_public: true, is_localized: true });
    server.create('locale', { id: 4, locale: 'ru-ru', name: 'Russian', is_public: true, is_localized: true });

    server.create('template', {
      brand,
      name: 'cases_email_notification',
      contents: '{{ foo }}',
      resource_url: `http://localhost:4200/api/v1/brands/${brand.id}/templates/cases_email_notification`
    });

    server.create('template', {
      brand,
      name: 'base_email_notification',
      contents: '{{ bar }}',
      resource_url: `http://localhost:4200/api/v1/brands/${brand.id}/templates/base_email_notification`
    });

    server.create('template', {
      brand,
      name: 'cases_email_satisfaction',
      contents: '{{ baz }}',
      resource_url: `http://localhost:4200/api/v1/brands/${brand.id}/templates/cases_email_satisfaction`
    });

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });

    login(session.id);
  },

  afterEach() {
    logout();
  }
});


test('editing brand', function (assert) {
  visit('/admin/customizations/brands/2');
  andThen(() => fillIn('.qa-brand-edit-name', 'Another name'));
  andThen(() => fillIn('.qa-brand-edit-alias', 'dremora.com'));
  andThen(() => click('button[type=submit]'));
  andThen(() => assert.equal(currentURL(), '/admin/customizations/brands'));
  andThen(() => {
    assertRows(assert, [
      ['Another name', 'dremora.com', ['canEdit', 'canDisable', 'canMakeDefault', 'canDelete']],
      ['Default', 'support.kayako.com', ['isDefault', 'canEdit']]
    ], [
      ['Disabled', 'disabled.kayako.com', ['canEdit', 'canEnable', 'canDelete']]
    ]);
  });
});

test('editing brand SSL settings', function (assert) {
  visit('/admin/customizations/brands/2');
  andThen(() => fillIn('.qa-brand-edit-name', 'Another name'));
  andThen(() => assert.ok(find('.qa-brand-edit-ssl-edit').text().includes('Set certificate'), 'button says "Set certificate"'));
  andThen(() => click('.qa-brand-edit-ssl-edit'));
  andThen(() => fillIn('.qa-brand-edit-ssl-certificate', 'certificate'));
  andThen(() => fillIn('.qa-brand-edit-private-key', 'private key'));
  andThen(() => click('button[type=submit]'));
  andThen(() => assert.equal(currentURL(), '/admin/customizations/brands'));
  visit('/admin/customizations/brands/2');
  andThen(() => assert.ok(find('.qa-brand-edit-ssl-edit').text().includes('Replace certificate'), 'button says "Replace certificate"'));
});

test('editing brand templates via textarea', function (assert) {
  withVariation('release-improved-email-template-editing', false);

  visit('/admin/customizations/email-templates');
  andThen(() => assert.equal(find('.qa-brand-edit-templates-reply').val(), '{{ foo }}', 'Reply says "{{ foo }}"'));
  andThen(() => assert.equal(find('.qa-brand-edit-templates-notification').val(), '{{ bar }}', 'Reply says "{{ bar }}"'));
  andThen(() => assert.equal(find('.qa-brand-edit-templates-satisfaction-survey').val(), '{{ baz }}', 'Reply says "{{ baz }}"'));
  andThen(() => fillIn('.qa-brand-edit-templates-reply', '{{ contents }}'));
  andThen(() => click('.qa-ko-form_buttons__submit'));
  visit('/admin/customizations/email-templates');
  andThen(() => assert.equal(find('.qa-brand-edit-templates-reply').val(), '{{ contents }}', 'Reply says "{{ contents }}"'));
});

test('editing brand templates via ace editor', function (assert) {
  withVariation('release-improved-email-template-editing', true);

  visit('/admin/customizations/email-templates');
  andThen(() => assert.equal(find('.qa-brand-edit-templates-reply span.ace_text')[0].innerHTML, '{{ foo }}', 'Reply says "{{ foo }}"'));
  andThen(() => assert.equal(find('.qa-brand-edit-templates-notification span.ace_text')[0].innerHTML, '{{ bar }}', 'Reply says "{{ bar }}"'));
  andThen(() => assert.equal(find('.qa-brand-edit-templates-satisfaction-survey span.ace_text')[0].innerHTML, '{{ baz }}', 'Reply says "{{ baz }}"'));
  andThen(() => fillIn('.qa-brand-edit-templates-reply textarea.ace_text-input', '{{ contents }}'));
  andThen(() => click('.qa-ko-form_buttons__submit'));
  visit('/admin/customizations/email-templates');
  andThen(() => assert.equal(find('.qa-brand-edit-templates-reply span.ace_text')[0].innerHTML, '{{ contents }}{{ foo }}', 'Reply says "{{ contents }}"'));
});
