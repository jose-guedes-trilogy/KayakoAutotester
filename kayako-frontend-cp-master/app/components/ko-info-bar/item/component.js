import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  id: null,
  qaClass: null,
  isEdited: false,
  isKREEdited: false,
  isActive: false,
  isDisabled: false,
  hasError: false,

  onClick: () => {},
  onMouseDown: () => {}
});
