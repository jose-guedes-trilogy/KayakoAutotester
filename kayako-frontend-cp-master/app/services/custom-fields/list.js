import Service from '@ember/service';

export default Service.extend({
  componentFor(fieldType) {
    switch (fieldType) {
      case 'TEXT':
        return 'ko-info-bar/field/text';
      case 'TEXTAREA':
        return 'ko-info-bar/field/multiline-text';
      case 'CHECKBOX':
        return 'ko-info-bar/field/checkbox';
      case 'SELECT':
        return 'ko-info-bar/field/select';
      case 'CASCADINGSELECT':
        return 'ko-info-bar/field/cascadingselect';
      case 'RADIO':
        return 'ko-info-bar/field/radio';
      case 'NUMERIC':
        return 'ko-info-bar/field/numeric';
      case 'DECIMAL':
        return 'ko-info-bar/field/decimal';
      case 'YESNO':
        return 'ko-info-bar/field/yesno';
      case 'DATE':
        return 'ko-info-bar/field/date';
      case 'REGEX':
        return 'ko-info-bar/field/regex';
      default:
        return '';
    }
  }
});
