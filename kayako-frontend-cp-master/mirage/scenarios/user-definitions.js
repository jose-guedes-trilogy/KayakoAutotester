import {
  operatorsForInputTypeIntegerOrFloat,
  operatorsForInputTypeString,
  operatorsForInputTypeStringExact,
  operatorsForInputTypeBooleanOrOptionsOrAutocomplete,
  operatorsForInputTypeBooleanTrueOrFalse,
  operatorsForInputTypeBooleanTrue,
  operatorsForInputTypeOptions,
  operatorsForInputTypeTags,
  operatorsForInputTypeDateAbsolute,
  operatorsForInputTypeDateRelativeBefore,
  operatorsForInputTypeDateRelativeAfter
} from './definition-operators';

import {
  valuesForInputTypeDateRelativeBefore,
  valuesForInputTypeDateRelativeAfter,
  valuesForTimeZones,
  valuesForLocales,
  valuesForCollection,
  valuesForCustom
} from './definition-values';

export default function(server) {
  server.create('definition', {
    field: 'users.fullname',
    label: 'Name',
    type: 'STRING',
    operators: operatorsForInputTypeString(),
    input_type: 'STRING',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.email',
    label: 'Email',
    type: 'STRING',
    operators: operatorsForInputTypeString(),
    input_type: 'STRING',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.event',
    label: 'Event',
    type: 'STRING',
    operators: operatorsForInputTypeString(),
    input_type: 'STRING',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'userbrowsers.os',
    label: 'OS',
    type: 'COLLECTION',
    operators: operatorsForInputTypeTags(),
    input_type: 'MULTIPLE',
    values: valuesForCustom,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.browser',
    label: 'Browser',
    type: 'STRING',
    operators: operatorsForInputTypeString(),
    input_type: 'STRING',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.browserversion',
    label: 'Browser Version',
    type: 'STRING',
    operators: operatorsForInputTypeString(),
    input_type: 'STRING',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.city',
    label: 'City',
    type: 'STRING',
    operators: operatorsForInputTypeString(),
    input_type: 'STRING',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.country',
    label: 'Country',
    type: 'STRING',
    operators: operatorsForInputTypeString(),
    input_type: 'STRING',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.region',
    label: 'Region',
    type: 'STRING',
    operators: operatorsForInputTypeStringExact(),
    input_type: 'STRING',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.organization',
    label: 'Organization',
    type: 'AUTOCOMPLETE',
    operators: operatorsForInputTypeBooleanOrOptionsOrAutocomplete(),
    input_type: 'AUTOCOMPLETE',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.texttypecustomfield',
    label: 'Text Type Custom Field',
    type: 'STRING',
    operators: operatorsForInputTypeString(),
    input_type: 'STRING',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.createdat_relative_before',
    label: 'Created at',
    type: 'DATE_RELATIVE',
    sub_type: 'PRESENT_OR_FUTURE',
    group: 'DATE',
    operators: operatorsForInputTypeDateRelativeBefore(),
    input_type: 'DATE_RELATIVE',
    values: valuesForInputTypeDateRelativeBefore(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.createdat_relative_after',
    label: 'Created at',
    type: 'DATE_RELATIVE',
    sub_type: 'PRESENT_OR_FUTURE',
    group: 'DATE',
    operators: operatorsForInputTypeDateRelativeAfter(),
    input_type: 'DATE_RELATIVE',
    values: valuesForInputTypeDateRelativeAfter(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.createdat_absolute',
    label: 'Created at',
    type: 'DATE_ABSOLUTE',
    group: 'DATE',
    operators: operatorsForInputTypeDateAbsolute(),
    input_type: 'DATE_ABSOLUTE',
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.updatedat_relative_before',
    label: 'Updated at',
    type: 'DATE_RELATIVE',
    sub_type: 'PRESENT_OR_FUTURE',
    group: 'DATE',
    operators: operatorsForInputTypeDateRelativeBefore(),
    input_type: 'DATE_RELATIVE',
    values: valuesForInputTypeDateRelativeBefore(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.updatedat_relative_after',
    label: 'Updated at',
    type: 'DATE_RELATIVE',
    sub_type: 'PRESENT_OR_FUTURE',
    group: 'DATE',
    operators: operatorsForInputTypeDateRelativeAfter(),
    input_type: 'DATE_RELATIVE',
    values: valuesForInputTypeDateRelativeAfter(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.updatedat_absolute',
    label: 'Updated at',
    type: 'DATE_ABSOLUTE',
    group: 'DATE',
    operators: operatorsForInputTypeDateAbsolute(),
    input_type: 'DATE_ABSOLUTE',
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.lastseenat_relative_before',
    label: 'Last seen at',
    type: 'DATE_RELATIVE',
    sub_type: 'PRESENT_OR_FUTURE',
    group: 'DATE',
    operators: operatorsForInputTypeDateRelativeBefore(),
    input_type: 'DATE_RELATIVE',
    values: valuesForInputTypeDateRelativeBefore(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.lastseenat_relative_after',
    label: 'Last seen at',
    type: 'DATE_RELATIVE',
    sub_type: 'PRESENT_OR_FUTURE',
    group: 'DATE',
    operators: operatorsForInputTypeDateRelativeAfter(),
    input_type: 'DATE_RELATIVE',
    values: valuesForInputTypeDateRelativeAfter(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.lastseenat_absolute',
    label: 'Last seen at',
    type: 'DATE_ABSOLUTE',
    group: 'DATE',
    operators: operatorsForInputTypeDateAbsolute(),
    input_type: 'DATE_ABSOLUTE',
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.lastloggedinat_relative_before',
    label: 'Last logged in at',
    type: 'DATE_RELATIVE',
    sub_type: 'PRESENT_OR_FUTURE',
    group: 'DATE',
    operators: operatorsForInputTypeDateRelativeBefore(),
    input_type: 'DATE_RELATIVE',
    values: valuesForInputTypeDateRelativeBefore(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.lastloggedinat_relative_after',
    label: 'Last logged in at',
    type: 'DATE_RELATIVE',
    sub_type: 'PRESENT_OR_FUTURE',
    group: 'DATE',
    operators: operatorsForInputTypeDateRelativeAfter(),
    input_type: 'DATE_RELATIVE',
    values: valuesForInputTypeDateRelativeAfter(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.lastloggedinat_absolute',
    label: 'Last logged in at',
    type: 'DATE_ABSOLUTE',
    group: 'DATE',
    operators: operatorsForInputTypeDateAbsolute(),
    input_type: 'DATE_ABSOLUTE',
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.datetypecustomfield_relative_past',
    label: 'Date type custom field',
    type: 'DATE_RELATIVE',
    sub_type: 'PRESENT_OR_FUTURE',
    group: 'DATE',
    operators: operatorsForInputTypeDateRelativeBefore(),
    input_type: 'DATE_RELATIVE',
    values: valuesForInputTypeDateRelativeBefore(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.datetypecustomfield_relative_future',
    label: 'Date type custom field',
    type: 'DATE_RELATIVE',
    sub_type: 'PRESENT_OR_FUTURE',
    group: 'DATE',
    operators: operatorsForInputTypeDateRelativeAfter(),
    input_type: 'DATE_RELATIVE',
    values: valuesForInputTypeDateRelativeAfter(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.datetypecustomfield_absolute',
    label: 'Date type custom field',
    type: 'DATE_ABSOLUTE',
    group: 'DATE',
    operators: operatorsForInputTypeDateAbsolute(),
    input_type: 'DATE_ABSOLUTE',
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.profiletimezone',
    label: 'Profile Timezone',
    type: 'STRING',
    operators: operatorsForInputTypeBooleanOrOptionsOrAutocomplete(),
    input_type: 'OPTIONS',
    values: valuesForTimeZones(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.timezone',
    label: 'Timezone',
    type: 'STRING',
    operators: operatorsForInputTypeBooleanOrOptionsOrAutocomplete(),
    input_type: 'OPTIONS',
    values: valuesForTimeZones(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.locale',
    label: 'Locale',
    type: 'STRING',
    operators: operatorsForInputTypeBooleanOrOptionsOrAutocomplete(),
    input_type: 'OPTIONS',
    values: valuesForLocales(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.tags',
    label: 'Tags',
    type: 'COLLECTION',
    operators: operatorsForInputTypeTags(),
    input_type: 'TAGS',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.isenabled',
    label: 'Enabled',
    type: 'BOOLEAN',
    operators: operatorsForInputTypeBooleanTrue(),
    input_type: 'BOOLEAN',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.enabledcustomfield',
    label: 'Enabled custom field',
    type: 'BOOLEAN',
    operators: operatorsForInputTypeBooleanTrue(),
    input_type: 'BOOLEAN',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.date',
    label: 'Options type custom field',
    operators: operatorsForInputTypeOptions(),
    input_type: 'OPTIONS',
    values: valuesForCustom(),
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.integer',
    label: 'Integer Type Custom Field',
    type: 'NUMERIC',
    sub_type: 'INTEGER',
    operators: operatorsForInputTypeIntegerOrFloat(),
    input_type: 'INTEGER',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.decimal',
    label: 'Decimal Type Custom Field',
    type: 'NUMERIC',
    sub_type: 'FLOAT',
    operators: operatorsForInputTypeIntegerOrFloat(),
    input_type: 'FLOAT',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.yesornotoggletypecustomfield',
    label: 'Yes No Toggle Custom Field',
    operators: operatorsForInputTypeBooleanTrueOrFalse(),
    input_type: 'BOOLEAN',
    values: null,
    _mirage_group: 'USER'
  });

  server.create('definition', {
    field: 'users.multiselecttypecustomfield',
    label: 'Multi Select Type Custom Field',
    type: 'COLLECTION',
    operators: operatorsForInputTypeTags(),
    input_type: 'MULTIPLE',
    values: valuesForCollection(),
    _mirage_group: 'USER'
  });
}
