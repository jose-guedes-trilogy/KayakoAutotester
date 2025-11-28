import Component from '@ember/component';

export default Component.extend({
  tagName: '',
  // Attributes
  onFormSelected: null,
  selectedForm: null,
  forms: null,
  isEdited: false,
  isErrored: false,
  isDisabled: false,
  showBottomArrow: true
});
