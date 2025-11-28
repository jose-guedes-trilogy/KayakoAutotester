import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // Attributes
  qaClass: null,
  title: '',
  disabled: false,
  onClick: () => {},
  onClose: () => {},

  actions: {
    clicked() {
      if (!this.get('disabled')) {
        this.get('onClose')(...arguments);
        this.get('onClick')(...arguments);
      }
    }
  }
});
