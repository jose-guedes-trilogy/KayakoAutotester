import Component from '@ember/component';

export default Component.extend({
  // Attributes
  qaClass: null,
  value: null,
  field: null,
  priorities: [],
  isEdited: false,
  isKREEdited: false,
  isErrored: false,
  isDisabled: false,
  onValueChange: null,

  // HTML
  tagName: ''
});
