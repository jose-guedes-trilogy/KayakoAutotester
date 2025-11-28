import { helper } from '@ember/component/helper';

export default helper(([definition]) => {
  let label = definition.get('label').toLowerCase().replace(/ /g,'');
  let inputType = definition.get('operators.firstObject.input.inputType');

  switch (label) {
    case 'name':
      return 'definitions/name';
    case 'email':
      return 'definitions/email';
    case 'event':
      return 'definitions/date';
    case 'os':
      return 'definitions/os';
    case 'browser':
    case 'browserversion':
      return 'definitions/browser';
    case 'city':
    case 'country':
    case 'region':
    case 'language':
      return 'definitions/position';
    case 'organization':
      return 'definitions/organization';
    case 'createdat':
      return 'definitions/created';
    case 'updatedat':
      return 'definitions/updated';
    case 'lastseen':
      return 'definitions/last-seen';
    case 'lastloggedin':
      return 'definitions/last-logged-in';
    case 'timezone':
      return 'definitions/timezone';
    case 'date':
      return 'definitions/date';
    case 'tags':
      return 'definitions/tag';
    case 'integer':
      return 'definitions/integer';
    case 'decimal':
      return 'definitions/decimal';
    case 'role':
      return 'definitions/select';
    case 'twitter':
      return 'definitions/twitter';
    case 'phone':
      return 'definitions/phone';
    case 'facebook':
      return 'definitions/facebook';
  }

  if (inputType === 'OPTIONS' || inputType === 'MULTIPLE' || inputType === 'AUTOCOMPLETE') {
    return 'definitions/select';
  } else if (inputType === 'DATE_ABSOLUTE' || inputType === 'DATE_RELATIVE') {
    return 'definitions/date';
  } else if (inputType === 'BOOLEAN') {
    return 'definitions/toggle';
  } else if (inputType === 'TAGS') {
    return 'definitions/tag';
  } else if (inputType === 'INTEGER') {
    return 'definitions/integer';
  } else if (inputType === 'FLOAT') {
    return 'definitions/decimal';
  } else if (inputType === 'STRING') {
    return 'definitions/text';
  }
});
