import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // Attributes
  value: null,
  placeholder: null,
  onChange: null,

  actions: {
    setDate(close, date) {
      close();
      if (this.get('onChange')) {
        this.get('onChange')(date);
      }
    }
  }
});
