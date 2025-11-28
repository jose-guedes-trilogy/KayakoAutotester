import settings from '../fixtures/settings';
import { createDefaultCaseStatuses } from './case-statuses';

export default function(server, defaultLocale, adminRole, defaultUser, anotherUser, primaryUser, slaVersion, slaMetrics) {
  const businesshour = server.create('business-hour', { title: 'Default Business Hours' });
  const teams = server.createList('team', 4, { businesshour });

  const emails = [
    server.create('identity-email', { is_primary: true, is_validated: true, is_new: false }),
    server.create('identity-email', { email: 'altenative@gmail.com', is_validated: true, is_new: false }),
    server.create('identity-email', { email: 'newemail@example.com', is_validated: false, is_new: false })
  ];

  //USER FIELDS
  const textCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const textDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const textUserField = server.create('user-field', {
      title: textFieldTitle,
      type: 'TEXT',
      customer_titles: [{ id: textCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: textDescriptionLocaleUserField.id, resource_type: 'locale_field' }]
    });

  const textAreaCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const textAreaDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const textareaUserField = server.create('user-field', {
      title: textAreaFieldTitle,
      type: 'TEXTAREA',
      customer_titles: [{ id: textAreaCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: textAreaDescriptionLocaleUserField.id, resource_type: 'locale_field' }]
    });

  const radioCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const radioDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const radioOptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const radioUserOption = server.create('field-option', {
      values: [{ id: radioOptionLocaleUserField.id, resource_type: 'locale_field' }]
    });
  server.create('user-field', {
      title: radioFieldTitle,
      type: 'RADIO',
      customer_titles: [{ id: radioCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: radioDescriptionLocaleUserField.id, resource_type: 'locale_field' }],
      options: [{ id: radioUserOption.id, resource_type: 'field_option' }]
    });

  const selectCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const selectDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const selectOptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const selectUserOption = server.create('field-option', {
      values: [{ id: selectOptionLocaleUserField.id, resource_type: 'locale_field' }]
    });
  const selectUserField = server.create('user-field', {
      title: normalSelectFieldTitle,
      type: 'SELECT',
      customer_titles: [{ id: selectCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: selectDescriptionLocaleUserField.id, resource_type: 'locale_field' }],
      options: [{ id: selectUserOption.id, resource_type: 'field_option' }]
    });

  const checkboxCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const checkboxDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const checkboxOptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const checkboxUserOption = server.create('field-option', {
      values: [{ id: checkboxOptionLocaleUserField.id, resource_type: 'locale_field' }]
    });
  server.create('user-field', {
      title: checkboxFieldTitle,
      type: 'CHECKBOX',
      customer_titles: [{ id: checkboxCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: checkboxDescriptionLocaleUserField.id, resource_type: 'locale_field' }],
      options: [{ id: checkboxUserOption.id, resource_type: 'field_option' }]
    });

  const numericCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const numericDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  server.create('user-field', {
      title: numericFieldTitle,
      type: 'NUMERIC',
      customer_titles: [{ id: numericCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: numericDescriptionLocaleUserField.id, resource_type: 'locale_field' }]
    });

  const decimalCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const decimalDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  server.create('user-field', {
      title: decimalFieldTitle,
      type: 'DECIMAL',
      customer_titles: [{ id: decimalCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: decimalDescriptionLocaleUserField.id, resource_type: 'locale_field' }]
    });

  const fileCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const fileDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  server.create('user-field', {
      title: fileFieldTitle,
      type: 'FILE',
      customer_titles: [{ id: fileCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: fileDescriptionLocaleUserField.id, resource_type: 'locale_field' }]
    });

  const yesNoCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const yesNoDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  server.create('user-field', {
      title: yesNoFieldTitle,
      type: 'YESNO',
      customer_titles: [{ id: yesNoCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: yesNoDescriptionLocaleUserField.id, resource_type: 'locale_field' }]
    });

  const cascadingSelectCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const cascadingSelectDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const cascadingSelectOptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const cascadingSelectUserOption = server.create('field-option', {
      values: [{ id: cascadingSelectOptionLocaleUserField.id, resource_type: 'locale_field' }]
    });
  server.create('user-field', {
      title: cascadingSelectFieldTitle,
      type: 'CASCADINGSELECT',
      customer_titles: [{ id: cascadingSelectCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: cascadingSelectDescriptionLocaleUserField.id, resource_type: 'locale_field' }],
      options: [{ id: cascadingSelectUserOption.id, resource_type: 'field_option' }]
    });

  const dateCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const dateDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  server.create('user-field', {
      title: dateFieldTitle,
      type: 'DATE',
      customer_titles: [{ id: dateCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: dateDescriptionLocaleUserField.id, resource_type: 'locale_field' }]
    });

  const regexCustomerTitleLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  const regexDescriptionLocaleUserField = server.create('locale-field', { locale: 'en-us' });
  server.create('user-field', {
      title: regexFieldTitle,
      type: 'REGEX',
      customer_titles: [{ id: regexCustomerTitleLocaleUserField.id, resource_type: 'locale_field' }],
      descriptions: [{ id: regexDescriptionLocaleUserField.id, resource_type: 'locale_field' }],
      regular_expression: '^(.*)'
    });
  //USER FIELDS END

  const custom_fields = [
    server.create('user-field-value', { field: textUserField }),
    server.create('user-field-value', { field: textareaUserField }),
    server.create('user-field-value', { field: selectUserField })
  ];

  const metadata = server.create('metadata');
  server.create('organization', {
    domains: [server.create('identity-domain')],
    metadata: metadata,
    tags: server.createList('tag', 2)
  });
  server.createList('organization', 10);

  server.create('session', { user: defaultUser });
  [
    'admin.teams.manage',
    'admin.roles.manage',
    'admin.settings.manage',
    'admin.business_hours.manage',
    'admin.brands.manage',
    'admin.organizations_fields.manage',
    'admin.user_fields.manage',
    'admin.users.update',
    'admin.users.delete',
    'admin.organizations.update',
    'admin.organizations.delete',
    'admin.endpoints.manage',
    'admin.case_fields.manage',
    'admin.case_views.manage',
    'admin.macros.manage',
    'admin.automations.manage',
    'admin.slas.manage',
    'admin.channels.manage',
    'admin.cases.merge',
    'admin.cases.split',
    'admin.cases.public_reply',
    'admin.cases.trash',
    'admin.chats.accept',
    'admin.help_center.manage'
  ].forEach(name => server.create('permission', { name } ));

  const identityEmail = server.create('identity-email');

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

  //CASE FIELDS
  const textCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const textDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  server.create('case-field', {
    title: textFieldTitle,
    type: 'TEXT',
    customer_titles: [{ id: textCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: textDescriptionLocaleCaseField.id, resource_type: 'locale_field' }]
  });

  const textAreaCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const textAreaDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  server.create('case-field', {
    title: textAreaFieldTitle,
    type: 'TEXTAREA',
    customer_titles: [{ id: textAreaCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: textAreaDescriptionLocaleCaseField.id, resource_type: 'locale_field' }]
  });

  const radioCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const radioDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const radioOptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const radioCaseOption = server.create('field-option', {
    values: [{ id: radioOptionLocaleCaseField.id, resource_type: 'locale_field' }]
  });
  server.create('case-field', {
    title: radioFieldTitle,
    type: 'RADIO',
    customer_titles: [{ id: radioCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: radioDescriptionLocaleCaseField.id, resource_type: 'locale_field' }],
    options: [{ id: radioCaseOption.id, resource_type: 'field_option' }]
  });

  const selectCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const selectDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const selectOptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const selectCaseOption = server.create('field-option', {
    values: [{ id: selectOptionLocaleCaseField.id, resource_type: 'locale_field' }]
  });
  server.create('case-field', {
    title: normalSelectFieldTitle,
    type: 'SELECT',
    customer_titles: [{ id: selectCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: selectDescriptionLocaleCaseField.id, resource_type: 'locale_field' }],
    options: [{ id: selectCaseOption.id, resource_type: 'field_option' }]
  });

  const checkboxCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const checkboxDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const checkboxOptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const checkboxCaseOption = server.create('field-option', {
    values: [{ id: checkboxOptionLocaleCaseField.id, resource_type: 'locale_field' }]
  });
  server.create('case-field', {
    title: checkboxFieldTitle,
    type: 'CHECKBOX',
    customer_titles: [{ id: checkboxCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: checkboxDescriptionLocaleCaseField.id, resource_type: 'locale_field' }],
    options: [{ id: checkboxCaseOption.id, resource_type: 'field_option' }]
  });

  const numericCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const numericDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  server.create('case-field', {
    title: numericFieldTitle,
    type: 'NUMERIC',
    customer_titles: [{ id: numericCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: numericDescriptionLocaleCaseField.id, resource_type: 'locale_field' }]
  });

  const decimalCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const decimalDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  server.create('case-field', {
    title: decimalFieldTitle,
    type: 'DECIMAL',
    customer_titles: [{ id: decimalCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: decimalDescriptionLocaleCaseField.id, resource_type: 'locale_field' }]
  });

  const fileCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const fileDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  server.create('case-field', {
    title: fileFieldTitle,
    type: 'FILE',
    customer_titles: [{ id: fileCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: fileDescriptionLocaleCaseField.id, resource_type: 'locale_field' }]
  });

  const yesNoCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const yesNoDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  server.create('case-field', {
    title: yesNoFieldTitle,
    type: 'YESNO',
    customer_titles: [{ id: yesNoCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: yesNoDescriptionLocaleCaseField.id, resource_type: 'locale_field' }]
  });

  const cascadingSelectCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const cascadingSelectDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const cascadingSelectOptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const cascadingSelectCaseOption = server.create('field-option', {
    values: [{ id: cascadingSelectOptionLocaleCaseField.id, resource_type: 'locale_field' }]
  });
  server.create('case-field', {
    title: cascadingSelectFieldTitle,
    type: 'CASCADINGSELECT',
    customer_titles: [{ id: cascadingSelectCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: cascadingSelectDescriptionLocaleCaseField.id, resource_type: 'locale_field' }],
    options: [{ id: cascadingSelectCaseOption.id, resource_type: 'field_option' }]
  });

  const dateCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const dateDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  server.create('case-field', {
    title: dateFieldTitle,
    type: 'DATE',
    customer_titles: [{ id: dateCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: dateDescriptionLocaleCaseField.id, resource_type: 'locale_field' }]
  });

  const regexCustomerTitleLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  const regexDescriptionLocaleCaseField = server.create('locale-field', { locale: 'en-us' });
  server.create('case-field', {
    title: regexFieldTitle,
    type: 'REGEX',
    customer_titles: [{ id: regexCustomerTitleLocaleCaseField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: regexDescriptionLocaleCaseField.id, resource_type: 'locale_field' }],
    regular_expression: '^(.*)'
  });
//CASE FIELDS END


//ORGANIZATION FIELDS
  const textCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const textDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  server.create('organization-field', {
    title: textFieldTitle,
    type: 'TEXT',
    customer_titles: [{ id: textCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: textDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }]
  });

  const textAreaCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const textAreaDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  server.create('organization-field', {
    title: textAreaFieldTitle,
    type: 'TEXTAREA',
    customer_titles: [{ id: textAreaCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: textAreaDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }]
  });

  const radioCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const radioDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const radioOptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const radioOrganizationOption = server.create('field-option', {
    values: [{ id: radioOptionLocaleOrganizationField.id, resource_type: 'locale_field' }]
  });
  server.create('organization-field', {
    title: radioFieldTitle,
    type: 'RADIO',
    customer_titles: [{ id: radioCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: radioDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }],
    options: [{ id: radioOrganizationOption.id, resource_type: 'field_option' }]
  });

  const selectCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const selectDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const selectOptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const selectOrganizationOption = server.create('field-option', {
    values: [{ id: selectOptionLocaleOrganizationField.id, resource_type: 'locale_field' }]
  });
  server.create('organization-field', {
    title: normalSelectFieldTitle,
    type: 'SELECT',
    customer_titles: [{ id: selectCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: selectDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }],
    options: [{ id: selectOrganizationOption.id, resource_type: 'field_option' }]
  });

  const checkboxCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const checkboxDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const checkboxOptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const checkboxOrganizationOption = server.create('field-option', {
    values: [{ id: checkboxOptionLocaleOrganizationField.id, resource_type: 'locale_field' }]
  });
  server.create('organization-field', {
    title: checkboxFieldTitle,
    type: 'CHECKBOX',
    customer_titles: [{ id: checkboxCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: checkboxDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }],
    options: [{ id: checkboxOrganizationOption.id, resource_type: 'field_option' }]
  });

  const numericCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const numericDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  server.create('organization-field', {
    title: numericFieldTitle,
    type: 'NUMERIC',
    customer_titles: [{ id: numericCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: numericDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }]
  });

  const decimalCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const decimalDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  server.create('organization-field', {
    title: decimalFieldTitle,
    type: 'DECIMAL',
    customer_titles: [{ id: decimalCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: decimalDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }]
  });

  const fileCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const fileDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  server.create('organization-field', {
    title: fileFieldTitle,
    type: 'FILE',
    customer_titles: [{ id: fileCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: fileDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }]
  });

  const yesNoCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const yesNoDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  server.create('organization-field', {
    title: yesNoFieldTitle,
    type: 'YESNO',
    customer_titles: [{ id: yesNoCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: yesNoDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }]
  });

  const cascadingSelectCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const cascadingSelectDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const cascadingSelectOptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const cascadingSelectOrganizationOption = server.create('field-option', {
    values: [{ id: cascadingSelectOptionLocaleOrganizationField.id, resource_type: 'locale_field' }]
  });
  server.create('organization-field', {
    title: cascadingSelectFieldTitle,
    type: 'CASCADINGSELECT',
    customer_titles: [{ id: cascadingSelectCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: cascadingSelectDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }],
    options: [{ id: cascadingSelectOrganizationOption.id, resource_type: 'field_option' }]
  });

  const dateCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const dateDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  server.create('organization-field', {
    title: dateFieldTitle,
    type: 'DATE',
    customer_titles: [{ id: dateCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: dateDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }]
  });

  const regexCustomerTitleLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  const regexDescriptionLocaleOrganizationField = server.create('locale-field', { locale: 'en-us' });
  server.create('organization-field', {
    title: regexFieldTitle,
    type: 'REGEX',
    customer_titles: [{ id: regexCustomerTitleLocaleOrganizationField.id, resource_type: 'locale_field' }],
    descriptions: [{ id: regexDescriptionLocaleOrganizationField.id, resource_type: 'locale_field' }],
    regular_expression: '^(.*)'
  });
//ORGANIZATION FIELDS END

  const columns = server.createList('column', 5);
  const stringProposition = server.create('proposition', {
    field: 'cases.subject',
    operator: 'string_contains',
    value: 'dave'
  });
  const optionsProposition = server.create('proposition', {
    field: 'cases.casestatusid',
    operator: 'comparison_lessthan',
    value: '1'
  });
  const autocompleteProposition = server.create('proposition', {
    field: 'cases.assigneeagentid',
    operator: 'comparison_equalto',
    value: primaryUser.id
  });
  const tagsProposition = server.create('proposition', {
    field: 'tags.name',
    operator: 'collection_contains_any_insensitive',
    value: 'dave'
  });
  const timeProposition = server.create('proposition', {
    field: 'cases.lastagentactivityat',
    operator: 'time_greaterthan',
    value: ''
  });
  const dateAbsoluteProposition = server.create('proposition', {
    field: 'cases.test_date_absolute',
    operator: 'date_is',
    value: ''
  });
  const dateRelativeProposition = server.create('proposition', {
    field: 'casefields.test_date',
    operator: 'date_after',
    value: ''
  });
  const decimalProposition = server.create('proposition', {
    field: 'casefields.test_decimal',
    operator: 'comparison_equalto',
    value: ''
  });
  const integerProposition = server.create('proposition', {
    field: 'casefields.test_integer',
    operator: 'comparison_equalto',
    value: ''
  });
  const booleanTrueProposition = server.create('proposition', {
    field: 'requesterfields.test_file',
    operator: 'comparison_equalto',
    value: ''
  });
  const multipleProposition = server.create('proposition', {
    field: 'cases.test_multiple',
    operator: 'contains_one_of_the_following',
    value: ''
  });
  const simplePredicateCollection = server.create('predicate-collection', {
    propositions: [stringProposition]
  });
  const complexPredicateCollection = server.create('predicate-collection', {
    propositions: [
      stringProposition,
      optionsProposition,
      autocompleteProposition,
      tagsProposition,
      timeProposition,
      dateAbsoluteProposition,
      dateRelativeProposition,
      decimalProposition,
      integerProposition,
      booleanTrueProposition,
      multipleProposition
    ]
  });

  server.create('trigger-channel', { name: 'API', events: [] });
  server.create('trigger-channel', { name: 'MAIL', events: ['INCOMING_EMAIL'] });
  server.create('trigger-channel', { name: 'TWITTER', events: ['MENTION', 'DIRECT_MESSAGE', 'SAVED_SEARCH'] });
  server.create('trigger-channel', { name: 'FACEBOOK', events: ['WALL_POST', 'MESSAGE'] });
  server.create('trigger-channel', { name: 'CHAT', events: [] });
  server.create('trigger-channel', { name: 'HELPCENTER', events: [] });
  server.create('trigger-channel', { name: 'SYSTEM', events: ['SLA_BREACH', 'TRIGGER', 'MONITOR'] });

  for (let i = 0; i < 6; i++) {
    let proposition = server.create('proposition', {
      field: 'cases.subject',
      operator: 'string_contains',
      value: 'tarquin'
    });
    let collection = server.create('predicate-collection', {
      propositions: [{ id: proposition.id, resource_type: 'proposition'}]
    });
    let action = server.create('automation-action');
    server.create('trigger', {
      predicate_collections: [
        { id: collection.id, resource_type: 'predicate_collection' }
      ],
      action: { id: action.id, resource_type: 'automation_action' }
    });
  }

  for (let i = 0; i < 6; i++) {
    let proposition = server.create('proposition', {
      field: 'cases.subject',
      operator: 'string_contains',
      value: 'tarquin'
    });
    let collection = server.create('predicate-collection', {
      propositions: [{ id: proposition.id, resource_type: 'proposition'}]
    });
    let action = server.create('automation-action');
    server.create('trigger', {
      is_enabled: false,
      predicate_collections: [
        { id: collection.id, resource_type: 'predicate_collection' }
      ],
      action: { id: action.id, resource_type: 'automation_action' }
    });
  }

  // AUTOMATION ACTION DEFINITION
  let automationActionDefinitions = [
    {
      'label': 'Status',
      'name': 'status',
      'options': ['CHANGE'],
      'input_type': 'OPTIONS',
      'value_type': 'NUMERIC',
      'values': {
        '8': 'Open',
        '10': 'On Hold',
        '12': 'Closed',
        '101': 'Impex/Upgrade',
        '115': 'Churn',
        '155': 'Update from JIRA',
        '156': 'Inline Chat Tickets',
        '157': 'Closed-Renewals',
        '158': 'Closed-Outbound',
        '160': 'Pending',
        '161': 'Completed',
        '162': 'test (will delete)',
        '163': 'TestStatus'
      },
      'attributes': [],
      'group': 'CASE',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Priority',
      'name': 'priority',
      'options': [
        'CHANGE',
        'INCREASE',
        'DECREASE'
      ],
      'input_type': 'OPTIONS',
      'value_type': 'NUMERIC',
      'values': {
        '0': 'none',
        '14': 'Low',
        '18': 'High',
        '24': 'Critical',
        '26': 'Normal'
      },
      'attributes': [],
      'group': 'CASE',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Type',
      'name': 'type',
      'options': ['CHANGE'],
      'input_type': 'OPTIONS',
      'value_type': 'NUMERIC',
      'values': {
        '0': 'none',
        '2': 'Issue',
        '4': 'Task',
        '24': 'Incident',
        '25': 'Installation',
        '26': 'Question',
        '27': 'Problem',
        '29': 'custom'
      },
      'attributes': [],
      'group': 'CASE',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Assignee',
      'name': 'assignee',
      'options': ['CHANGE'],
      'input_type': 'AUTOCOMPLETE',
      'value_type': 'NUMERIC',
      'values': {
        '-4': '(Current user)',
      },
      'attributes': [],
      'group': 'CASE',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Tags',
      'name': 'tags',
      'options': [
        'ADD',
        'REMOVE',
        'REPLACE'
      ],
      'input_type': 'TAGS',
      'value_type': 'COLLECTION',
      'values': '',
      'attributes': [],
      'group': 'CASE',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Team',
      'name': 'team',
      'options': ['CHANGE'],
      'input_type': 'OPTIONS',
      'value_type': 'NUMERIC',
      'values': {
        '14': 'Sales',
        '16': 'Support',
        '43': 'Billing',
        '44': 'Engineering',
        '46': 'Hello',
        '48': 'New Business',
        '49': 'Renewals',
        '50': 'Customer Success',
        '52': 'IT',
        '53': 'The #1 Team'
      },
      'attributes': [],
      'group': 'CASE',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Satisfaction survey',
      'name': 'satisfactionsurvey',
      'options': ['SEND'],
      'input_type': 'BOOLEAN_TRUE',
      'value_type': 'BOOLEAN',
      'values': '',
      'attributes': [],
      'group': 'CASE',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Email a user',
      'name': 'notificationuser',
      'options': ['SEND'],
      'input_type': 'NOTIFICATION_USER',
      'value_type': 'ATTRIBUTES',
      'values': {
        '-2': '(Last active user)',
        '-3': '(Requester)',
        '-4': '(Assignee)'
      },
      'attributes': [
        'subject',
        'message'
      ],
      'group': 'NOTIFICATION',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Email a team',
      'name': 'notificationteam',
      'options': ['SEND'],
      'input_type': 'NOTIFICATION_TEAM',
      'value_type': 'ATTRIBUTES',
      'values': {
        '14': 'Sales',
        '16': 'Support',
        '43': 'Billing',
        '44': 'Engineering',
        '46': 'Hello',
        '48': 'New Business',
        '49': 'Renewals',
        '50': 'Customer Success',
        '52': 'IT',
        '53': 'The #1 Team',
        '-5': '(Assigned team)'
      },
      'attributes': [
        'subject',
        'message'
      ],
      'group': 'NOTIFICATION',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Stop notifications',
      'name': 'stopnotification',
      'options': ['SEND'],
      'input_type': 'BOOLEAN_TRUE',
      'value_type': 'BOOLEAN',
      'values': '',
      'attributes': [],
      'group': 'FLOW_CONTROL',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Stop processing other rules',
      'name': 'stoprules',
      'options': ['SEND'],
      'input_type': 'BOOLEAN_TRUE',
      'value_type': 'BOOLEAN',
      'values': '',
      'attributes': [],
      'group': 'FLOW_CONTROL',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Test Slack thing',
      'name': 'endpoint_2',
      'options': ['SEND'],
      'input_type': 'ENDPOINT_SLACK',
      'value_type': 'STRING',
      'values': '',
      'attributes': [],
      'group': 'ENDPOINT',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Some XML thing',
      'name': 'endpoint_3',
      'options': ['SEND'],
      'input_type': 'ENDPOINT_HTTP_XML',
      'value_type': 'STRING',
      'values': '',
      'attributes': [],
      'group': 'ENDPOINT',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Example email endpoint',
      'name': 'endpoint_4',
      'options': ['SEND'],
      'input_type': 'ENDPOINT_EMAIL',
      'value_type': 'STRING',
      'values': '',
      'attributes': [],
      'group': 'ENDPOINT',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'POST json example',
      'name': 'endpoint_5',
      'options': ['SEND'],
      'input_type': 'ENDPOINT_HTTP_JSON',
      'value_type': 'STRING',
      'values': '',
      'attributes': [],
      'group': 'ENDPOINT',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'GET example',
      'name': 'endpoint_6',
      'options': ['SEND'],
      'input_type': 'ENDPOINT_HTTP',
      'value_type': 'STRING',
      'values': '',
      'attributes': [],
      'group': 'ENDPOINT',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Test',
      'name': 'endpoint_8',
      'options': ['SEND'],
      'input_type': 'ENDPOINT_HTTP',
      'value_type': 'STRING',
      'values': '',
      'attributes': [],
      'group': 'ENDPOINT',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Helpdesk URL!',
      'name': 'customfield_2',
      'options': ['CHANGE'],
      'input_type': 'STRING',
      'value_type': 'STRING',
      'values': '',
      'attributes': [],
      'group': 'CUSTOM_FIELD',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Admin Username',
      'name': 'customfield_4',
      'options': ['CHANGE'],
      'input_type': 'STRING',
      'value_type': 'STRING',
      'values': '',
      'attributes': [],
      'group': 'CUSTOM_FIELD',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'BACON',
      'name': 'customfield_82',
      'options': ['CHANGE'],
      'input_type': 'STRING',
      'value_type': 'STRING',
      'values': '',
      'attributes': [],
      'group': 'CUSTOM_FIELD',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Yes / No',
      'name': 'customfield_84',
      'options': ['CHANGE'],
      'input_type': 'BOOLEAN',
      'value_type': 'BOOLEAN',
      'values': '',
      'attributes': [],
      'group': 'CUSTOM_FIELD',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'RZ: Date',
      'name': 'customfield_85',
      'options': ['CHANGE'],
      'input_type': 'DATE_ABSOLUTE',
      'value_type': 'DATE_ABSOLUTE',
      'values': '',
      'attributes': [],
      'group': 'CUSTOM_FIELD',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Cascading',
      'name': 'customfield_888',
      'options': ['CHANGE'],
      'input_type': 'CASCADING_SELECT',
      'value_type': 'NUMERIC',
      'values': {
        '15': 'Sales \\ Name A',
        '16': 'Sales \\ Name B',
        '17': 'Support \\ Name C',
        '18': 'Support \\ Name D'
      },
      'attributes': [],
      'group': 'CUSTOM_FIELD',
      'resource_type': 'automation_action_definition'
    },
    {
      'label': 'Bug Test',
      'name': 'customfield_86',
      'options': [
        'ADD',
        'REMOVE'
      ],
      'input_type': 'MULTIPLE',
      'value_type': 'COLLECTION',
      'values': {
        '57': 'aaa111',
        '58': 'aaa112',
        '59': 'aaa113',
        '60': 'aaa114'
      },
      'attributes': [],
      'group': 'CUSTOM_FIELD',
      'resource_type': 'automation_action_definition'
    }
  ].map((data) => server.create('automation-action-definition', data));

  automationActionDefinitions.forEach((definition, i) => {
    let proposition = server.create('proposition', {
      field: 'cases.subject',
      operator: 'string_contains',
      value: 'dave'
    });
    let collection = server.create('predicate-collection', {
      propositions: [{ id: proposition.id, resource_type: 'proposition'}]
    });
    let action;
    let value = '';
    if (definition.attributes.length > 0) {
      let attributes = definition.attributes.reduce((ary, attr) => {
        return ary.concat([{ name: attr, value: `${attr} ${i}` }]);
      }, []);
      if (definition.name === 'notificationuser') {
        value = '1';
      } else if (definition.name === 'notificationteam') {
        value = Object.keys(definition.values)[0];
      }
      action = server.create('automation-action', { name: definition.name, value, attributes });
    } else {
      if (definition.input_type === 'ENDPOINT_HTTP_JSON') {
        value = '{ "foo": "bar" }';
      } else if (definition.input_type === 'ENDPOINT_HTTP_XML') {
        value = '<note>\n  <to>Tove</to>\n  <from>Jani</from>\n  <heading>Reminder</heading>\n  <body>Don\'t forget me this weekend!</body>\n</note>';
      } else if (definition.input_type === 'ENDPOINT_HTTP') {
        value = JSON.stringify({ this: 'is sparta', foo: 'bar' });
      }
      action = server.create('automation-action', { name: definition.name, value });
    }
    server.create('monitor', {
      title: `Monitor ${i} (${definition.input_type})`,
      is_enabled: i % 2 === 0,
      predicate_collections: [
        { id: collection.id, resource_type: 'predicate_collection' }
      ],
      actions: [{ id: action.id, resource_type: 'automation_action' }]
    });
  });

  // VIEWS
  server.create('view', {
    title: 'Inbox',
    is_default: true,
    is_enabled: true,
    is_system: true,
    order_by: 'DESC',
    order_by_column: 'caseid',
    columns: columns,
    sort_order: 1,
    type: 'INBOX'
  });
  server.create('view', {
    title: 'Test basic custom view',
    is_default: false,
    is_enabled: true,
    is_system: false,
    order_by: 'DESC',
    order_by_column: 'caseid',
    columns: columns,
    predicate_collections: [simplePredicateCollection],
    sort_order: 2,
    type: 'CUSTOM',
    visibility_type: 'ALL'
  });
  server.create('view', {
    title: 'Example of all predicate input types',
    is_default: false,
    is_enabled: true,
    is_system: false,
    order_by: 'DESC',
    order_by_column: 'caseid',
    columns: columns,
    predicate_collections: [complexPredicateCollection],
    sort_order: 3,
    type: 'CUSTOM',
    visibility_type: 'ALL'
  });
  server.create('view', {
    title: 'Trash',
    is_default: false,
    is_enabled: true,
    is_system: true,
    sort_order: 5,
    type: 'TRASH'
  });

  let operatorsForInputTypeIntegerOrFloat = [
    'comparison_equalto',
    'comparison_not_equalto',
    'comparison_greaterthan',
    'comparison_greaterthan_or_equalto',
    'comparison_lessthan',
    'comparison_lessthan_or_equalto'
  ];
  let operatorsForInputTypeString = [
    'string_contains',
    'string_does_not_contain'
  ];
  let operatorsForInputTypeBooleanOrOptionsOrAutocomplete = [
    'comparison_equalto',
    'comparison_not_equalto'
  ];
  let operatorsForInputTypeBooleanTrueOrFalse = [
    'comparison_equalto'
  ];
  let operatorsForInputTypeTags = [
    'collection_contains_insensitive',
    'collection_contains_any_insensitive'
  ];
  let operatorsForInputTypeTime = [
    'time_greaterthan',
    'time_greaterthan_or_equalto',
    'time_lessthan',
    'time_lessthan_or_equalto'
  ];
  let operatorsForInputTypeDateAbsolute = [
    'date_is',
    'date_is_not'
  ];
  let operatorsForInputTypeDateRelative = [
    'date_after',
    'date_after_or_on',
    'date_before',
    'date_before_or_on'
  ];
  let operatorsForInputTypeMultiple = [
    'contains_one_of_the_following',
    'contains_none_of_the_following',
    'contains_all_of_the_following'
  ];

  server.create('definition', {
    field: 'cases.subject',
    group: 'CASES',
    type: 'STRING',
    sub_type: '',
    input_type: 'STRING',
    label: 'STRING',
    operators: operatorsForInputTypeString,
    values: ''
  });
  server.create('definition', {
    field: 'cases.casestatusid',
    group: 'CASES',
    type: 'NUMERIC',
    sub_type: 'INTEGER',
    input_type: 'OPTIONS',
    label: 'OPTIONS',
    operators: operatorsForInputTypeBooleanOrOptionsOrAutocomplete,
    values: {
      1: 'New',
      2: 'Open',
      3: 'Pending',
      4: 'Completed',
      5: 'Closed'
    }
  });
  server.create('definition', {
    field: 'cases.assigneeagentid',
    group: 'CASES',
    sub_type: 'INTEGER',
    type: 'NUMERIC',
    input_type: 'AUTOCOMPLETE',
    label: 'AUTOCOMPLETE',
    operators: operatorsForInputTypeBooleanOrOptionsOrAutocomplete,
    values: {
      '(current_user)': '(Current user)',
      '(requester)': '(Requester)'
    }
  });
  server.create('definition', {
    field: 'tags.name',
    group: 'CASES',
    sub_type: '',
    type: 'COLLECTION',
    input_type: 'TAGS',
    label: 'TAGS',
    operators: operatorsForInputTypeTags,
    values: ''
  });
  server.create('definition', {
    field: 'cases.lastagentactivityat',
    group: 'CASES',
    sub_type: 'PAST',
    type: 'TIME',
    input_type: 'TIME',
    label: 'TIME PAST',
    operators: operatorsForInputTypeTime,
    values: ''
  });
  server.create('definition', {
    field: 'cases.test_date_absolute',
    group: 'CASES',
    sub_type: '',
    type: 'DATE_ABSOLUTE',
    input_type: 'DATE_ABSOLUTE',
    label: 'DATE ABSOLUTE',
    operators: operatorsForInputTypeDateAbsolute,
    values: ''
  });
  server.create('definition', {
    field: 'casefields.test_date',
    group: 'CASES',
    sub_type: 'PRESENT_OR_FUTURE',
    type: 'DATE_RELATIVE',
    input_type: 'DATE_RELATIVE',
    label: 'DATE RELATIVE',
    operators: operatorsForInputTypeDateRelative,
    values: {
      yesterday: 'yesterday',
      lastweek: 'lastweek',
      lastmonth: 'lastmonth',
      lastyear: 'lastyear',
      last7days: 'last7days',
      last30days: 'last30days',
      last90days: 'last90days',
      last180days: 'last180days',
      last365days: 'last365days'
    }
  });
  server.create('definition', {
    field: 'casefields.test_decimal',
    group: 'REQUESTER',
    sub_type: 'FLOAT',
    type: 'NUMERIC',
    input_type: 'FLOAT',
    label: 'FLOAT',
    operators: operatorsForInputTypeIntegerOrFloat,
    values: ''
  });
  server.create('definition', {
    field: 'casefields.test_integer',
    group: 'REQUESTER',
    sub_type: 'INTEGER',
    type: 'NUMERIC',
    input_type: 'INTEGER',
    label: 'INTEGER',
    operators: operatorsForInputTypeIntegerOrFloat,
    values: ''
  });
  server.create('definition', {
    field: 'requesterfields.test_file',
    group: 'REQUESTER',
    sub_type: '',
    type: 'BOOLEAN',
    input_type: 'BOOLEAN_TRUE',
    label: 'BOOLEAN TRUE',
    operators: operatorsForInputTypeBooleanTrueOrFalse,
    values: ''
  });
  server.create('definition', {
    field: 'cases.test_multiple',
    group: 'CASES',
    sub_type: '',
    type: 'COLLECTION',
    input_type: 'MULTIPLE',
    label: 'MULTIPLE',
    operators: operatorsForInputTypeMultiple,
    values: {
      optionOne: 'optionOne',
      optionTwo: 'optionTwo'
    }
  });

  const sourceChannel = server.create('channel');
  const assignedAgent = defaultUser;
  const assignedTeam = teams[0];
  server.create('locale', {
    locale: 'en-us'
  });
  server.create('locale', {
    locale: 'fr-ca'
  });
  server.create('locale', {
    locale: 'de'
  });
  const brand = server.create('brand', { locale: defaultLocale });
  const statuses = createDefaultCaseStatuses(server);
  const status = statuses[0];
  const priority = server.create('case-priority');
  const type = server.create('type');
  server.createList('sla', 10);
  const caseFields = server.createList('case-field', 14);

  // TODO make mirage work with relationships embedded into model fragments
  // const customFields = server.createList('case-field-value', 2, { field: caseFields[0], value: '' });
  const customFields = [];
  let caseData = {
    source_channel: sourceChannel,
    creator: defaultUser,
    identity: identityEmail,
    assignedAgent: {id: 1, resource_type: 'user'},
    assignedTeam: {id: 1, resource_type: 'team'},
    brand: brand,
    status: { id: status.id, resource_type: 'case_status' },
    priority: { id: priority.id, resource_type: 'case_priority' },
    type: { id: type.id, resource_type: 'case_type' },
    sla_version: slaVersion,
    sla_metrics: slaMetrics,
    custom_fields: customFields,
    metadata: metadata,
    last_replier: defaultUser,
    last_replier_identity: identityEmail
  };

  server.create('case', Object.assign({ tags: server.createList('tag', 2), requester: anotherUser }, caseData));
  server.create('case', Object.assign({ tags: server.createList('tag', 2), requester: defaultUser }, caseData));
  server.create('case', Object.assign({ tags: server.createList('tag', 2), requester: anotherUser }, caseData));
  server.create('case', Object.assign({ tags: server.createList('tag', 2), requester: defaultUser }, caseData));

  // Case with a non-default status
  server.create('case', {
    id: 5,
    source_channel: sourceChannel,
    requester: defaultUser,
    creator: defaultUser,
    identity: identityEmail,
    assignedAgent: assignedAgent,
    assignedTeam: assignedTeam,
    brand: brand,
    status: { id: statuses[3].id, resource_type: 'case_status' },
    priority: { id: priority.id, resource_type: 'case_priority' },
    type: { id: type.id, resource_type: 'case_type' },
    sla_version: slaVersion,
    sla_metrics: slaMetrics,
    tags: server.createList('tag', 2),
    custom_fields: customFields,
    metadata: metadata,
    last_replier: defaultUser,
    last_replier_identity: identityEmail
  });

  server.createList('case', 50, {
    source_channel: null,
    requester: defaultUser,
    creator: defaultUser,
    identity: identityEmail,
    assignedAgent: assignedAgent,
    assignedTeam: assignedTeam,
    brand: brand,
    status: { id: status.id, resource_type: 'case_status' },
    priority: { id: priority.id, resource_type: 'case_priority' },
    type: { id: type.id, resource_type: 'case_type' },
    sla_version: slaVersion,
    sla_metrics: slaMetrics,
    tags: server.createList('tag', 2),
    custom_fields: customFields,
    metadata: metadata,
    last_replier: defaultUser,
    last_replier_identity: identityEmail
  });

  const mailbox = server.create('mailbox', { brand, is_default: true });
  server.create('channel', {
    uuid: 1,
    account: mailbox
  });
  server.create('channel', {
    uuid: 2,
    type: 'TWITTER',
    account: server.create('mailbox', {
      uuid: 2,
      screen_name: 'testman',
      address: 'twittertest',
      brand: brand,
      account_id: 123
    })
  });
  server.create('channel', {
    uuid: 3,
    type: 'NOTE',
  });

  server.createList('identity-email', 10);
  server.createList('case-priority', 3);
  server.createList('case-type', 4, {
    resource_url: (i) => {
      return 'http://novo/api/index.php?/v1/cases/types/' + ++i;
    }
  });
  server.create('case-form', {
    fields: caseFields,
    brand: brand
  });

  server.create('facebook-account');
  server.create('twitter-account', {
    brand: brand
  });
  server.create('facebook-page');


  //// If possible this endpoint should implement pagination (plus limit) in order to behave
  //// as it would in the real world app, to be able to use infinite scroll
  //server.createList('post', 30, { creator: defaultUser, identity: identityEmail, case_id: +server.schema.db.cases[0].id });
  //let attachments = [
    //{
      //id: 1,
      //resource_type: 'attachment'
    //}, {
      //id: 2,
      //resource_type: 'attachment'
    //}
  //];
  //server.createList('post', 1, { creator: defaultUser, identity: identityEmail, attachments: attachments});

  server.createList('attachment', 3);

  // server.createList('activity', 5);

  server.create('identity-phone');

  server.create('message-recipient', {
    identity: identityEmail
  });

  const userModels = server.createList('user', 20, {
    role: adminRole,
    teams: teams,
    emails: emails.map(function(item) { return { id: item.id, resource_type: 'identity_email'}; }),
    custom_fields,
    metadata: metadata
  });

  const identityEmailModels = server.createList('identity-email', 10, {
    email: (i) => {
      return 'random-email-' + i + '@kayako-unreal.com';
    }
  });

  for (let i = 0; i < 10; i++) {
    server.create('identity-autocomplete-email', {
      identity: {
        id: identityEmailModels[i].id,
        resource_type: 'identity_email'
      },
      parent: {
        id: userModels[i].id,
        resource_type: 'user'
      }
    });
  }

  server.create('plan', {
    limits: {
      collaborators: 10,
      custom_headers: 3
    },
    features: [{
      code: 'collaborators',
      resource_type: 'product_feature'
    }, {
      code: 'custom_security_policy',
      resource_type: 'product_feature'
    }],
    account_id: '123',
    subscription_id: '123'
  });

  const macroAssignee = server.create('macro-assignee');
  const macroVisibility = server.create('macro-visibility');

  server.create('macro', {
    agent: defaultUser,
    assignee: macroAssignee,
    visibility: macroVisibility
  });

  server.createList('mail', 5, { status: 'RECEIVED' });
  server.createList('mail', 12, { is_suspended: true, status: 'SUSPENDED', suspension_code: 'SPAM' });

  server.createList('businesshours', 10);

  server.create('brand', {
    is_enabled: true,
    name: 'Custom Alias',
    domain: 'kayako.com',
    sub_domain: 'custom_alias',
    alias: 'example.com',
    is_default: false
  });

  server.create('brand', {
    is_enabled: false,
    name: 'Disabled',
    domain: 'kayako.com',
    sub_domain: 'disabled',
    is_default: false
  });

  settings.forEach(setting => server.create('setting', setting));

  server.create('template', {
    brand,
    name: 'cases_email_notification',
    contents: '{{ contents }} {{ footer }}',
    resource_url: `http://localhost:4200/api/v1/brands/${brand.id}/templates/cases_email_notification`
  });

  server.create('template', {
    brand,
    name: 'base_email_notification',
    contents: '{{ contents }} {{ footer }}',
    resource_url: `http://localhost:4200/api/v1/brands/${brand.id}/templates/base_email_notification`
  });

  server.create('template', {
    brand,
    name: 'cases_email_satisfaction',
    contents: '{{ contents }} {{ footer }}',
    resource_url: `http://localhost:4200/api/v1/brands/${brand.id}/templates/cases_email_satisfaction`
  });

  server.create('token', {
    label: 'test webhook',
    description: 'test description text here',
    token: 'PLSMwTkwODRu9R2qFkdUz0L9tzPekd7HxSVEDZyRu7f6V37BxLPeWJkzsAn2xPs2',
    is_enabled: true,
    execution_order: 1
  });
}
