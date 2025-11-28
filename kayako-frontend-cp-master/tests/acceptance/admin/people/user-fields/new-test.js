import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import { text } from 'frontend-cp/tests/helpers/dom-helpers';
import handlePostUserFields from 'frontend-cp/mirage/handlers/users/fields/post';

import checkboxStyles from 'frontend-cp/components/ko-checkbox/styles';
import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';

app('Acceptance | admin/team-settings/user fields/new', {
  beforeEach() {
    server.create('setting', {
      category: 'account',
      name: 'default_language',
      value: 'en-us'
    });
    const locale = server.create('locale', {
      id: 1,
      locale: 'en-us',
      is_public: true
    });
    const adminRole = server.create('role', { type: 'ADMIN' });
    const agent = server.create('user', { role: adminRole, locale: { id: locale.id, resource_type: 'locale' }, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    login(session.id);

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
  },

  afterEach() {
    logout();
  }
});

test('creating a new field sends locale fields for all public locales', function(assert) {
  assert.expect(7);

  server.create('locale', {
    id: 2,
    locale: 'es',
    is_public: false
  });

  visit('/admin/customizations/user-fields/new/TEXT');

  server.post('/api/v1/users/fields', (schema, request) => {
    const requestData = JSON.parse(request.requestBody);
    assert.equal(requestData.customer_titles.length, 1, '1 customer title');
    assert.equal(requestData.descriptions.length, 1, '1 description');
    assert.equal(requestData.customer_titles[0].locale, 'en-us', 'customer title locale');
    assert.equal(requestData.customer_titles[0].translation, '', 'customer title translation');
    assert.equal(requestData.descriptions[0].locale, 'en-us', 'description locale');
    assert.equal(requestData.descriptions[0].translation, '', 'description translation');

    return handlePostUserFields(schema, request);
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields/new/TEXT');

    fillIn('input.ko-admin_case-fields_edit__title', 'fieldTitle');
    click('.qa-ko-form_buttons__submit');
  });
});

test('creating a new text field', function(assert) {
  const fieldTitle = 'fieldTitle';
  const customerTitle = 'customer title';
  const description = 'description';

  visit('/admin/customizations/user-fields/new/TEXT');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields/new/TEXT');
    assert.equal(find('.qa-admin_case-fields_edit__api-key').length, 0);
    assert.equal(text('.qa-layout_two-columns__content h3'), 'User fields / Text / New', 'Edit form default title is correct');

    fillIn('input.ko-admin_case-fields_edit__title', fieldTitle);

    click(`div .${checkboxStyles.checkboxWrap}:contains(Customers can see this field) div`);
    fillIn('input.ko-admin_case-fields_edit__customer-title', customerTitle);
    fillIn('textarea.ko-admin_case-fields_edit__description', description);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields');
    click(`.${rowStyles.row}:contains(${fieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('.qa-admin_case-fields_edit__api-key').length, 1);
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), fieldTitle);
    assert.equal(find('input.ko-admin_case-fields_edit__customer-title').val(), customerTitle);
    assert.equal(find('textarea.ko-admin_case-fields_edit__description').val(), description);
  });
});

test('creating a new text area field', function(assert) {
  const fieldTitle = 'fieldTitle';
  const customerTitle = 'customer title';
  const description = 'description';

  visit('/admin/customizations/user-fields/new/TEXTAREA');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields/new/TEXTAREA');
    assert.equal(text('.qa-layout_two-columns__content h3'), 'User fields / Multi-line text / New', 'Edit form default title is correct');

    fillIn('input.ko-admin_case-fields_edit__title', fieldTitle);

    click(`div .${checkboxStyles.checkboxWrap}:contains(Customers can see this field) div`);
    fillIn('input.ko-admin_case-fields_edit__customer-title', customerTitle);
    fillIn('textarea.ko-admin_case-fields_edit__description', description);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields');
    click(`.${rowStyles.row}:contains(${fieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), fieldTitle);
    assert.equal(find('input.ko-admin_case-fields_edit__customer-title').val(), customerTitle);
    assert.equal(find('textarea.ko-admin_case-fields_edit__description').val(), description);
  });
});

test('creating a new numeric field', function(assert) {
  const fieldTitle = 'fieldTitle';
  const customerTitle = 'customer title';
  const description = 'description';

  visit('/admin/customizations/user-fields/new/NUMERIC');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields/new/NUMERIC');
    assert.equal(text('.qa-layout_two-columns__content h3'), 'User fields / Numerical input / New', 'Edit form default title is correct');

    fillIn('input.ko-admin_case-fields_edit__title', fieldTitle);

    click(`div .${checkboxStyles.checkboxWrap}:contains(Customers can see this field) div`);
    fillIn('input.ko-admin_case-fields_edit__customer-title', customerTitle);
    fillIn('textarea.ko-admin_case-fields_edit__description', description);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields');
    click(`.${rowStyles.row}:contains(${fieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), fieldTitle);
    assert.equal(find('input.ko-admin_case-fields_edit__customer-title').val(), customerTitle);
    assert.equal(find('textarea.ko-admin_case-fields_edit__description').val(), description);
  });
});

test('creating a new decimal field', function(assert) {
  const fieldTitle = 'fieldTitle';
  const customerTitle = 'customer title';
  const description = 'description';

  visit('/admin/customizations/user-fields/new/DECIMAL');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields/new/DECIMAL');
    assert.equal(text('.qa-layout_two-columns__content h3'), 'User fields / Decimal input / New', 'Edit form default title is correct');

    fillIn('input.ko-admin_case-fields_edit__title', fieldTitle);

    click(`div .${checkboxStyles.checkboxWrap}:contains(Customers can see this field) div`);
    fillIn('input.ko-admin_case-fields_edit__customer-title', customerTitle);
    fillIn('textarea.ko-admin_case-fields_edit__description', description);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields');
    click(`.${rowStyles.row}:contains(${fieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), fieldTitle);
    assert.equal(find('input.ko-admin_case-fields_edit__customer-title').val(), customerTitle);
    assert.equal(find('textarea.ko-admin_case-fields_edit__description').val(), description);
  });
});

test('creating a new yes/no toggle field', function(assert) {
  const fieldTitle = 'fieldTitle';
  const customerTitle = 'customer title';
  const description = 'description';

  visit('/admin/customizations/user-fields/new/YESNO');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields/new/YESNO');
    assert.equal(text('.qa-layout_two-columns__content h3'), 'User fields / Yes/No toggle / New', 'Edit form default title is correct');

    fillIn('input.ko-admin_case-fields_edit__title', fieldTitle);

    click(`div .${checkboxStyles.checkboxWrap}:contains(Customers can see this field) div`);
    fillIn('input.ko-admin_case-fields_edit__customer-title', customerTitle);
    fillIn('textarea.ko-admin_case-fields_edit__description', description);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields');
    click(`.${rowStyles.row}:contains(${fieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), fieldTitle);
    assert.equal(find('input.ko-admin_case-fields_edit__customer-title').val(), customerTitle);
    assert.equal(find('textarea.ko-admin_case-fields_edit__description').val(), description);
  });
});

test('creating a new date field', function(assert) {
  const fieldTitle = 'fieldTitle';
  const customerTitle = 'customer title';
  const description = 'description';

  visit('/admin/customizations/user-fields/new/DATE');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields/new/DATE');
    assert.equal(text('.qa-layout_two-columns__content h3'), 'User fields / Date / New', 'Edit form default title is correct');

    fillIn('input.ko-admin_case-fields_edit__title', fieldTitle);

    click(`div .${checkboxStyles.checkboxWrap}:contains(Customers can see this field) div`);
    fillIn('input.ko-admin_case-fields_edit__customer-title', customerTitle);
    fillIn('textarea.ko-admin_case-fields_edit__description', description);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields');
    click(`.${rowStyles.row}:contains(${fieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), fieldTitle);
    assert.equal(find('input.ko-admin_case-fields_edit__customer-title').val(), customerTitle);
    assert.equal(find('textarea.ko-admin_case-fields_edit__description').val(), description);
  });
});

test('creating a new regular expression field', function(assert) {
  const fieldTitle = 'fieldTitle';
  const customerTitle = 'customer title';
  const description = 'description';
  const regEx = 'regex';

  visit('/admin/customizations/user-fields/new/REGEX');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields/new/REGEX');
    assert.equal(text('.qa-layout_two-columns__content h3'), 'User fields / Regular expression / New', 'Edit form default title is correct');

    fillIn('input.ko-admin_case-fields_edit__title', fieldTitle);

    click(`div .${checkboxStyles.checkboxWrap}:contains(Customers can see this field) div`);
    fillIn('input.ko-admin_case-fields_edit__customer-title', customerTitle);
    fillIn('textarea.ko-admin_case-fields_edit__description', description);

    fillIn('input.ko-admin_case-fields_edit_regex__input', regEx);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/user-fields');
    click(`.${rowStyles.row}:contains(${fieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), fieldTitle);
    assert.equal(find('input.ko-admin_case-fields_edit__customer-title').val(), customerTitle);
    assert.equal(find('textarea.ko-admin_case-fields_edit__description').val(), description);
    assert.equal(find('input.ko-admin_case-fields_edit_regex__input').val(), regEx);
  });
});
