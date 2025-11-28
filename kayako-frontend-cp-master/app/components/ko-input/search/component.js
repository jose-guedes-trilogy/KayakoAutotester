import Component from '@ember/component';

export default Component.extend({
  // Attributes
  value: '',
  onInput: null,
  disabled: false,
  placeholder: null,
  qaClass: null,

  // HTML
  tagName: ''
});
