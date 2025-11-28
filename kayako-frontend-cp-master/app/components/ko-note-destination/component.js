import Component from '@ember/component';

export default Component.extend({
  actions: {
    onChange(option) {
      this.sendAction('onChange', option);
    }
  }
});
