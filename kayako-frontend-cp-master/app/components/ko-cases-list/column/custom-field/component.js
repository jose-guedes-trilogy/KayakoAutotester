import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  // Attributes:
  model: null,
  column: null,

  strippedColumnName: computed('column', function() {
    return this.get('column').replace('case_field_', '');
  }),

  field: computed('model', 'strippedColumnName', function() {
    const customFields = this.get('model.customFields');
    const columnName = this.get('strippedColumnName');

    return customFields.find(customField => {
      let fieldKey = customField.get('field.key');
      return fieldKey === columnName;
    });
  }),

  componentForColumn: computed('field', function() {
    const fieldType = this.get('field.field.fieldType');

    switch (fieldType) {
      case 'TEXT':
      case 'YESNO':
      case 'NUMERIC':
      case 'DECIMAL':
      case 'REGEX':
        return 'ko-cases-list/column/custom-field/string';
      case 'SELECT':
      case 'RADIO':
      case 'CASCADINGSELECT':
        return 'ko-cases-list/column/custom-field/single-choice';
      case 'CHECKBOX':
        return 'ko-cases-list/column/custom-field/multi-choice';
      case 'DATE':
        return 'ko-cases-list/column/custom-field/date';
    }
  })
});
