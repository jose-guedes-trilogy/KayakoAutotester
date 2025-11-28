import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';
import modalStyles from 'frontend-cp/components/ko-modal/styles';

const fieldTitle = 'test field';

app('Acceptance | admin/team-settings/organization fields/delete', {
  beforeEach() {
    const customerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const descriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    server.create('organization-field', {
      title: fieldTitle,
      customer_titles: [
        {
          id: customerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: descriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    const adminRole = server.create('role', { type: 'ADMIN' });
    const locale = server.create('locale', { locale: 'en-us' });
    const agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
    const sessionId = server.create('session', { user: agent }).id;
    login(sessionId);

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
  },

  afterEach() {
    logout();
  }
});

test('deleting a text field', function(assert) {
  assert.expect(4);

  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    triggerEvent(`.${rowStyles.row}:contains("${fieldTitle}")`, 'mouseenter');
  });

  andThen(function() {
    click(`.${rowStyles.row}:contains("${fieldTitle}") a:contains(Delete)`);
  });

  andThen(function() {
    assert.equal($(`.${modalStyles.content}`).length, 1, 'A modal opened to confirm leaving unsaved changes');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    assert.notOk(find(`span:contains("${fieldTitle}")`).length > 0);
  });
});
