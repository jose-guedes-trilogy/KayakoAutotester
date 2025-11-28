import {
  app,
  test
} from 'frontend-cp/tests/helpers/qunit';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';
import toggleStyles from 'frontend-cp/components/ko-toggle/styles';

const textFieldTitle = 'text field';
const textAreaFieldTitle = 'text area field';
const radioFieldTitle = 'radio field';
const normalSelectFieldTitle = 'normal select field';
const checkboxFieldTitle = 'checkbox field';
const numericFieldTitle = 'numeric field';
const decimalFieldTitle = 'decimal field';
const fileFieldTitle = 'file field';
const yesNoFieldTitle = 'yes no field';
const cascadingSelectFieldTitle = 'cascading select field';
const dateFieldTitle = 'date field';
const regexFieldTitle = 'regex field';

const optionTitle = 'option title';
const regEx = 'regEx';

app('Acceptance | admin/team-settings/organization fields/edit', {
  beforeEach() {
    /*eslint-disable camelcase*/
    server.create('setting', {
      category: 'account',
      name: 'default_language',
      value: 'en-us'
    });
    server.create('locale', {
      id: 1,
      locale: 'en-us',
      is_public: true
    });
    const textCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const textDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    server.create('organization-field', {
      title: textFieldTitle,
      type: 'TEXT',
      customer_titles: [
        {
          id: textCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: textDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    const textAreaCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const textAreaDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    server.create('organization-field', {
      title: textAreaFieldTitle,
      type: 'TEXTAREA',
      customer_titles: [
        {
          id: textAreaCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: textAreaDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    const radioCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const radioDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const radioOptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const radioOption = server.create('field-option', {
      values: [
        {
          id: radioOptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    server.create('organization-field', {
      title: radioFieldTitle,
      type: 'RADIO',
      customer_titles: [
        {
          id: radioCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: radioDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      options: [
        {
          id: radioOption.id,
          resource_type: 'field_option'
        }
      ]
    });
    const selectCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const selectDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const selectOptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const selectOption = server.create('field-option', {
      values: [
        {
          id: selectOptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    server.create('organization-field', {
      title: normalSelectFieldTitle,
      type: 'SELECT',
      customer_titles: [
        {
          id: selectCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: selectDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      options: [
        {
          id: selectOption.id,
          resource_type: 'field_option'
        }
      ]
    });
    const checkboxCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const checkboxDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const checkboxOptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const checkboxOption = server.create('field-option', {
      values: [
        {
          id: checkboxOptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    server.create('organization-field', {
      title: checkboxFieldTitle,
      type: 'CHECKBOX',
      customer_titles: [
        {
          id: checkboxCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: checkboxDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      options: [
        {
          id: checkboxOption.id,
          resource_type: 'field_option'
        }
      ]
    });
    const numericCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const numericDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    server.create('organization-field', {
      title: numericFieldTitle,
      type: 'NUMERIC',
      customer_titles: [
        {
          id: numericCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: numericDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    const decimalCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const decimalDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    server.create('organization-field', {
      title: decimalFieldTitle,
      type: 'DECIMAL',
      customer_titles: [
        {
          id: decimalCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: decimalDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    const fileCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const fileDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    server.create('organization-field', {
      title: fileFieldTitle,
      type: 'FILE',
      customer_titles: [
        {
          id: fileCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: fileDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    const yesNoCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const yesNoDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    server.create('organization-field', {
      title: yesNoFieldTitle,
      type: 'YESNO',
      customer_titles: [
        {
          id: yesNoCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: yesNoDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    const cascadingSelectCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const cascadingSelectDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const cascadingSelectOptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const cascadingSelectOption = server.create('field-option', {
      values: [
        {
          id: cascadingSelectOptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    server.create('organization-field', {
      title: cascadingSelectFieldTitle,
      type: 'CASCADINGSELECT',
      customer_titles: [
        {
          id: cascadingSelectCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: cascadingSelectDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      options: [
        {
          id: cascadingSelectOption.id,
          resource_type: 'field_option'
        }
      ]
    });
    const dateCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const dateDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    server.create('organization-field', {
      title: dateFieldTitle,
      type: 'DATE',
      customer_titles: [
        {
          id: dateCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: dateDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ]
    });
    const regexCustomerTitleLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    const regexDescriptionLocaleField = server.create('locale-field', {
      locale: 'en-us'
    });
    server.create('organization-field', {
      title: regexFieldTitle,
      type: 'REGEX',
      customer_titles: [
        {
          id: regexCustomerTitleLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      descriptions: [
        {
          id: regexDescriptionLocaleField.id,
          resource_type: 'locale_field'
        }
      ],
      regular_expression: '^(.*)'
    });
    const adminRole = server.create('role', { type: 'ADMIN' });
    const locale = server.create('locale', { locale: 'en-us' });
    const agent = server.create('user', { role: adminRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    login(session.id);

    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    /*eslint-enable camelcase*/
  },

  afterEach() {
    logout();
  }
});

test('editing a text field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains("${textFieldTitle}")`);
  });

  andThen(function() {
    assert.equal(find('.qa-admin_case-fields_edit__api-key').length, 1);
    findWithAssert('.qa-admin_case-fields_edit__api-key');
    fillIn('input.ko-admin_case-fields_edit__title', textFieldTitle);

    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${textFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), textFieldTitle);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
  });
});

test('editing a text area field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${textAreaFieldTitle})`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', textAreaFieldTitle);
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${textAreaFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), textAreaFieldTitle);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
  });
});

test('editing a radio field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${radioFieldTitle})`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', radioFieldTitle);
    fillIn('.qa-sortable-item:first input:first', optionTitle);
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${radioFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), radioFieldTitle);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
    assert.equal(find('.qa-sortable-item:first input:first').val(), optionTitle);
  });
});

test('editing a select field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${normalSelectFieldTitle})`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', normalSelectFieldTitle);
    fillIn('.qa-sortable-item:first input:first', optionTitle);
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${normalSelectFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), normalSelectFieldTitle);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
    assert.equal(find('.qa-sortable-item:first input:first').val(), optionTitle);
  });
});

test('editing a checkbox field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${checkboxFieldTitle})`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', checkboxFieldTitle);
    fillIn('.qa-sortable-item:first input:first', optionTitle);
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${checkboxFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), checkboxFieldTitle);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
    assert.equal(find('.qa-sortable-item:first input:first').val(), optionTitle);
  });
});

test('editing a numeric field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${numericFieldTitle})`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', numericFieldTitle);
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${numericFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), numericFieldTitle);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
  });
});

test('editing a decimal field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${decimalFieldTitle})`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', decimalFieldTitle);
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${decimalFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), decimalFieldTitle);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
  });
});

test('editing a file field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${fileFieldTitle})`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', fileFieldTitle);
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${fileFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), fileFieldTitle);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
  });
});

test('editing a yes no field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${yesNoFieldTitle})`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', yesNoFieldTitle);
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${yesNoFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), yesNoFieldTitle);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
  });
});

test('editing a cascading select field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${cascadingSelectFieldTitle})`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', cascadingSelectFieldTitle);
    fillIn('.qa-sortable-item:first input:first', optionTitle);
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${cascadingSelectFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), cascadingSelectFieldTitle);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
    assert.equal(find('.qa-sortable-item:first input:first').val(), optionTitle);
  });
});

test('editing a date field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${dateFieldTitle})`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', dateFieldTitle);
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${dateFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), dateFieldTitle);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
  });
});

test('editing a regular expression field', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${regexFieldTitle})`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', regexFieldTitle);
    fillIn('input.ko-admin_case-fields_edit_regex__input', regEx);
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__submit');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains(${regexFieldTitle})`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), regexFieldTitle);
    assert.equal(find('input.ko-admin_case-fields_edit_regex__input').val(), regEx);
    findWithAssert(`div .${toggleStyles.container}[aria-checked=false]`);
  });
});

test('cancelling an edit', function(assert) {
  visit('/admin/customizations/organization-fields');

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains("${textFieldTitle}")`);
  });

  andThen(function() {
    fillIn('input.ko-admin_case-fields_edit__title', 'edited field title');
    click(`.${toggleStyles.container}`);
    click('.qa-ko-form_buttons__cancel');
  });

  andThen(function() {
    assert.equal(find('.qa-ko-confirm-modal__body').text().trim(), 'You have unsaved changes on this page. Are you sure you want to discard these changes?', 'The proper confirm message is shown');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/customizations/organization-fields');
    click(`.${rowStyles.row}:contains("${textFieldTitle}")`);
  });

  andThen(function() {
    assert.equal(find('input.ko-admin_case-fields_edit__title').val(), 'text field');
    findWithAssert(`div .${toggleStyles.container}[aria-checked=true]`);
  });
});
