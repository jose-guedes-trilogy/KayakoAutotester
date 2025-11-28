import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';
import _ from 'npm:lodash';

import rowStyles from 'frontend-cp/components/ko-simple-list/row/styles';
import cellStyles from 'frontend-cp/components/ko-simple-list/cell/styles';
import actionStyles from 'frontend-cp/components/ko-simple-list/actions/styles';
import toggleStyles from 'frontend-cp/components/ko-toggle/styles';
import caseFormStyles from 'frontend-cp/session/admin/manage/case-forms/index/styles';

let brand, locale;
app('Acceptance | Admin | Manage | Conversation Forms', {
  beforeEach() {
    const emails = [
      server.create('identity-email', { email: 'first@example.com', is_primary: true, is_validated: true }),
      server.create('identity-email', { email: 'second@example.com', is_primary: false, is_validated: true }),
      server.create('identity-email', { email: 'third@example.com', is_primary: false, is_validated: false })
    ];
    locale = server.create('locale', { locale: 'en-us' });
    const user = server.create('user', { emails, role: server.create('role'), locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user });
    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });

    server.create('locale', {
      id: 2,
      locale: 'es-es',
      is_public: true
    });

    server.create('setting', {
      category: 'account',
      name: 'default_language',
      value: 'en-us'
    });

    brand = server.create('brand', { name: 'Brewfictus', locale });
    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('Creating Conversation Form followed by cancelling redirects back to Conversation Form Index', function(assert) {
  visit('/admin/conversations/forms');

  andThen(function() {
    click('.qa-admin_case-forms__new-button');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/conversations/forms/new');
    click('.qa-admin_case-forms__cancel-button');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/conversations/forms');
  });
});

test('Try to create new Conversation Form, Modify field, then Cancel, Prompt should appear, Agree, then redirects back to Conversation Form Index Page', function(assert) {
  visit('/admin/conversations/forms');

  andThen(function() {
    click('.qa-admin_case-forms__new-button');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/conversations/forms/new');
    fillIn('.qa-admin_case-forms_edit__title-input', 'Conversation Form Title');
  });

  andThen(function() {
    click('.qa-admin_case-forms__cancel-button');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/conversations/forms');
  });
});

test('Cancelling new case form after it was modified triggers prompt and prevents redirect when cancelled', function(assert) {
  visit('/admin/conversations/forms');
  andThen(function() {
    click('.qa-admin_case-forms__new-button');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/conversations/forms/new');
    fillIn('.qa-admin_case-forms_edit__title-input', 'Conversation Form Title');
  });

  andThen(function() {
    click('.qa-admin_case-forms__cancel-button');
    click('.qa-ko-confirm-modal__cancel');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/conversations/forms/new');
  });
});

test('Create New Conversation Form Workflow', function(assert) {
  server.createList('case-field', 5);

  server.create('case-field', {
    type: 'TEXT',
    key: 'not_system',
    title: 'Simple Text',
    customer_title: 'Simple Text',
    is_enabled: true,
    sort_order: 1,
    is_system: false
  });

  server.create('case-field', {
    type: 'CHECKBOX',
    key: 'not_system',
    title: 'Checkbox Field',
    customer_title: 'Checkbox Field',
    is_enabled: true,
    sort_order: 2,
    is_system: false
  });

  visit('/admin/conversations/forms');

  andThen(function() {
    click('.qa-admin_case-forms__new-button');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/conversations/forms/new');
    fillIn('.qa-admin_case-forms_edit__title-input', 'QA: Conversation Form Title');
  });

  andThen(function() {
    assert.equal(find('.qa-admin_case-forms__customer-title').length, 0);
    assert.equal(find('.qa-admin_case-forms__customer-description').length, 0);
  });

  andThen(function() {
    click('.qa-admin_case-forms__customer-available-checkbox');
  });

  andThen(function() {
    assert.equal(find('.qa-admin_case-forms__customer-title').length, 1);
    assert.equal(find('.qa-admin_case-forms__customer-description').length, 1);
    fillIn('.qa-admin_case-forms__customer-title', 'Customer Seen Title');
    fillIn('.qa-admin_case-forms__customer-description', 'Conversation Seen Description');
  });

  andThen(function() {
    assert.equal(find('.qa-admin_case-forms_edit_fields__row').length, 5);
    click('.qa-admin_case-forms_edit_fields__configure-dropdown .ember-basic-dropdown-trigger');
  });

  andThen(function() {
    assert.equal(find('.ember-power-select-option').length, 2);
    click('.ember-power-select-option:eq(0)');
  });

  andThen(function() {
    assert.equal(find('.qa-admin_case-forms_edit_fields__row').length, 6);
    click('.qa-admin_case-forms_edit_fields__configure-dropdown .ember-basic-dropdown-trigger');
  });

  andThen(function() {
    click('.ember-power-select-option:eq(0)');
  });

  andThen(function() {
    assert.equal(find('.qa-admin_case-forms_edit_fields__row').length, 7);
    triggerEvent('.qa-admin_case-forms_edit_fields__row:eq(6)', 'hover');
    click('.qa-admin_case-forms_edit_fields__row:eq(6) .qa-ko-admin_case-forms_edit_fields__action');
  });

  andThen(function() {
    assert.equal(find('.qa-admin_case-forms_edit_fields__row').length, 6);
    click('.qa-admin_case-forms_edit__submit-button');
  });

  andThen(function() {
    assert.equal(currentURL(), '/admin/conversations/forms');
    assert.equal(find(`.${caseFormStyles.title}:contains("QA: Conversation Form Title")`).length, 1);
  });
});

test('Default case forms have a visual indication of their status', function(assert) {
  server.create('case-form', {
    is_default: true,
    title: 'The Default Conversation Form',
    brand: brand
  });

  visit('/admin/conversations/forms');
  andThen(function() {
    assert.equal(
      find(`.qa-reordable-list .${cellStyles.cell}:eq(0)`).text().trim().replace(/[\s\n]+/g, ' '),
      'The Default Conversation Form (Brewfictus) (Default)'
    );
  });
});

test('Correct controls are displayed for non default case form', function(assert) {
  server.create('case-form', {
    is_default: false,
    title: 'A Regular Conversation Form',
    brand: brand
  });

  visit('/admin/conversations/forms');
  triggerEvent(`.${rowStyles.row}:first`, 'mouseenter');
  andThen(function() {
    assert.deepEqual(
      _.map(find(`.qa-reordable-list .${actionStyles.actions} a`), function(element) {
        return $(element).text().trim();
      }),
      ['Edit', 'Disable', 'Make default', 'Delete']
    );
  });
});

test('I do not see delete, disable, and make default for default case form', function(assert) {
  server.create('case-form', {
    is_default: true,
    title: 'The Default Conversation Form',
    brand: brand
  });

  visit('/admin/conversations/forms');
  triggerEvent(`.${rowStyles.row}:first`, 'mouseenter');
  andThen(function() {
    assert.deepEqual(
      _.map(find(`.qa-reordable-list .${actionStyles.actions} a`), function(element) {
        return $(element).text().trim();
      }),
      ['Edit']
    );
  });
});

test('I cannot disable a new case form', function(assert) {
  visit('/admin/conversations/forms/new');

  andThen(function() {
    assert.equal(typeof $(`.${toggleStyles.slider}`)[0], 'undefined');
  });
});

test('I can change default case form', function(assert) {
  assert.expect(5);

  server.create('case-form', {
    is_default: false,
    is_enabled: true,
    title: 'Form 1',
    brand: brand
  });

  server.create('case-form', {
    is_default: true,
    is_enabled: true,
    title: 'Form 2',
    brand: brand
  });

  visit('/admin/conversations/forms');
  triggerEvent(`.${rowStyles.row}:first`, 'mouseenter');

  andThen(function() {
    assert.equal(find('.qa-admin_case-forms__enabled-list .qa-admin_case-forms__list-row').length, 2);
    assert.equal(find(`.qa-admin_case-forms__enabled-list .qa-admin_case-forms__list-row:contains("Form 1") .${caseFormStyles.caption}:contains("(Default)")`).length, 0);
    assert.equal(find(`.qa-admin_case-forms__enabled-list .qa-admin_case-forms__list-row:contains("Form 2") .${caseFormStyles.caption}:contains("(Default)")`).length, 1);
    click('.qa-admin_case-forms__enabled-list .qa-admin_case-forms__list-row:contains("Form 1") a:contains("Make default")');
  });

  andThen(function() {
    assert.equal(find(`.qa-admin_case-forms__enabled-list .qa-admin_case-forms__list-row:contains("Form 1") .${caseFormStyles.caption}:contains("(Default)")`).length, 1);
    assert.equal(find(`.qa-admin_case-forms__enabled-list .qa-admin_case-forms__list-row:contains("Form 2") .${caseFormStyles.caption}:contains("(Default)")`).length, 0);
  });
});

test('I can delete regular case form (not default one)', function(assert) {
  assert.expect(2);

  const customerTitleLocaleField = server.create('locale-field', {
    locale: 'en-us'
  });
  const descriptionLocaleField = server.create('locale-field', {
    locale: 'en-us'
  });

  server.create('case-form', {
    is_default: false,
    is_enabled: true,
    title: 'Form 1',
    brand: brand,
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

  visit('/admin/conversations/forms');

  triggerEvent(`.${rowStyles.row}:first`, 'mouseenter');

  andThen(function() {
    assert.equal(find('.qa-admin_case-forms__enabled-list .qa-admin_case-forms__list-row').length, 1);
    click('.qa-admin_case-forms__enabled-list .qa-admin_case-forms__list-row:contains("Form 1") a:contains("Delete")');
    click('.qa-ko-confirm-modal__confirm');
  });

  andThen(function() {
    assert.equal(find('.qa-admin_case-forms__enabled-list .qa-admin_case-forms__list-row').length, 0);
  });
});
