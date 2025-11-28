import Component from '@ember/component';

export default Component.extend({
  // Attributes
  allowCreate: false,
  allowDelete: true,
  isDisabled: false,
  isEdited: false,
  isErrored: false,
  isKREEdited: false,
  onChange: null,
  onValueAddition: null,
  onValueRemoval: null,
  onSuggestion: null,
  placeholder: '',
  searchField: 'name',
  title: '',
  value: [],
  qaClass: null,

  // HTML
  tagName: ''
});
