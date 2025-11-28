import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // Attributes
  title: null,
  options: [],
  value: null,
  isEdited: false,
  isKREEdited: false,
  isErrored: false,
  isDisabled: false,
  onValueChange: null,
  hasEmptyOption: true,
  emptyLabel: '-',
  renderInPlace: false
});
