import Component from '@ember/component';

export default Component.extend({
  // Attributes
  qaClass: null,
  value: null,
  title: null,
  statuses: [],
  isEdited: false,
  isKREEdited: false,
  isErrored: false,
  isDisabled: false,
  onValueChange: null,

  // HTML
  tagName: ''
});
