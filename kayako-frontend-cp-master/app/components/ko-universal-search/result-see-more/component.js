import Component from '@ember/component';

export default Component.extend({
  tagName: '',
  onClick: () => {},

  actions: {
    clickHandler(event) {
      event.preventDefault();

      const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey;
      this.attrs.onClick(hasModifier);
    }
  }
});
