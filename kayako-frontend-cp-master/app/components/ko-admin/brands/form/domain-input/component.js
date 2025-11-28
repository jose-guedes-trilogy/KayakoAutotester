import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // Attributes
  value: '',
  domain: '',
  disabled: false,
  qaClass: null,
  onInput: () => {},

  // State
  focused: false,

  actions: {
    focus() {
      this.set('focused', true);
    },

    blur() {
      this.set('focused', false);
    }
  }
});
