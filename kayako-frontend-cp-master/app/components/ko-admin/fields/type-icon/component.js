import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  // Attributes
  name: '',

  // CPs
  assetPath: computed('name', function () {
    //absolute paths are used rather than interpolated strings so they are
    //treated as assets and fingerprinted
    switch (this.get('name')) {
      case 'TEXT':
        return '/images/icons/field-types/text.svg';
      case 'TEXTAREA':
        return '/images/icons/field-types/textarea.svg';
      case 'RADIO':
        return '/images/icons/field-types/radio.svg';
      case 'SELECT':
        return '/images/icons/field-types/select.svg';
      case 'CHECKBOX':
        return '/images/icons/field-types/checkbox.svg';
      case 'NUMERIC':
        return '/images/icons/field-types/numeric.svg';
      case 'DECIMAL':
        return '/images/icons/field-types/decimal.svg';
      case 'FILE':
        return '/images/icons/field-types/file.svg';
      case 'YESNO':
        return '/images/icons/field-types/yesno.svg';
      case 'CASCADINGSELECT':
        return '/images/icons/field-types/cascadingselect.svg';
      case 'DATE':
        return '/images/icons/field-types/date.svg';
      case 'REGEX':
        return '/images/icons/field-types/regex.svg';
    }
  })
});
