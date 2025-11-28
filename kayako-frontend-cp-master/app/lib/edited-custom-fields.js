import EmberObject, { computed } from '@ember/object';

export default EmberObject.extend({
  // Attributes
  originalCustomFields: [],
  editedCustomFields: [],

  // CPs
  idToEditedValueHash: computed('editedCustomFields.@each.value', function () {
    let map = {};
    this.get('editedCustomFields').forEach(field => {
      let id = field.get('field.id');
      if (id !== null && id !== undefined) {
        map[field.get('field.id')] = field.get('value');
      }
    });
    return map;
  }),

  editedIds: computed('originalCustomFields.@each.value', 'editedCustomFields.@each.value', function () {
    return this.get('editedCustomFields').filter(fieldObject => {
      let originalFieldObject = this.get('originalCustomFields').findBy('field.id', fieldObject.get('field.id'));
      if (!originalFieldObject) {
        // we do not consider field to be edited if it was undefined and became an empty string
        return Boolean(fieldObject.get('value'));
      }
      if (fieldObject.get('field.fieldType') === 'CHECKBOX') {
        // Special treatment of checkbox values since 10,12 is the same as 12,10
        const sort = value => (value || '').split(',').sort().join(',');

        const stringifiedFieldObjectIsNotTheSame = sort(originalFieldObject.get('value')) !== sort(fieldObject.get('value'));
        const fieldObjectHasChangedType = typeof originalFieldObject.get('value') !== typeof fieldObject.get('value');

        return stringifiedFieldObjectIsNotTheSame || fieldObjectHasChangedType;
      } else {
        return originalFieldObject.get('value') !== fieldObject.get('value');
      }
    }).map(fieldObject => fieldObject.get('field.id'));
  }),

  idToIsEditedHash: computed('editedIds.[]', function () {
    let map = {};
    this.get('editedIds').forEach(field => {
      map[field] = true;
    });
    return map;
  }),

  isEdited: computed('editedIds.[]', function () {
    return this.get('editedIds.length') > 0;
  }),

  // Methods
  setValue(field, value) {
    let valueObject = this.get('editedCustomFields').findBy('field.id', field.get('id'));

    if (!valueObject) {
      valueObject = EmberObject.create({ field, value });
      this.get('editedCustomFields').pushObject(valueObject);
    }

    const isCheckboxBeingUnset = field.get('fieldType') === 'CHECKBOX' && value === null;
    if (isCheckboxBeingUnset) {
      valueObject.set('value', null);
    } else {
      valueObject.set('value', value || '');
    }
  }
});
