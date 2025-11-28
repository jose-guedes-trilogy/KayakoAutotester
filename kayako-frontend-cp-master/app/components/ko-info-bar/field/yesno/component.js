import EmberObject from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  // Attributes
  title: null,
  options: null,
  value: null,
  isErrored: false,
  isEdited: false,
  isKREEdited: false,
  isDisabled: false,
  onValueChange: null,
  hasEmptyOption: false,
  emptyLabel: null,

  // HTML
  tagName: '',

  optionsList: [
    EmberObject.create({id: 'yes', value: 'Yes'}),
    EmberObject.create({id: 'no', value: 'No'})
  ]
});
