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

  // HTML
  tagName: ''
});
