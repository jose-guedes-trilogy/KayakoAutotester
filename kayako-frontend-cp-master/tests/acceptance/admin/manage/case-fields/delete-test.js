import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';
import modalStyles from 'frontend-cp/components/ko-modal/styles';

const fieldTitle = 'test field';

app('Acceptance | admin/manage/case fields/delete', {
  beforeEach() {
    const locale = server.create('locale', {
      id: 1,
      locale: 'en-us'
    });
    const customerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const descriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    server.create('case-field', {
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
      ],
      is_system: false
    });
    const adminRole = server.create('role', { type: 'ADMIN' });
    const agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    login(session.id);

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
  },

  afterEach() {
    logout();
  }
});

test('deleting a text field', function(assert) {
  assert.expect(4);

  visit('/admin/customizations/conversation-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/conversation-fields');
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
    assert.equal(currentURL(), '/admin/customizations/conversation-fields');
    assert.notOk(find(`span:contains("${fieldTitle}")`).length > 0);
  });
});
