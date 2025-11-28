import Component from '@ember/component';

export default Component.extend({
  // Attributes
  onClick: null,
  qaClass: null,
  isLoading: false,

  // State
  showActions: false,

  // HTML
  tagName: 'div',

  click(e) {
    let target = $(e.target);

    if (target.is('a, button')) {
      // If this click originated from a button within the row we don’t want to
      // overload its intended behaviour so end here.
      //
      // This is not a complete solution as it’s entirely possible that a <button>
      // or <a> could contain another element from which the click originated.
      return;
    }

    if (this.get('onClick')) {
      this.get('onClick')(e);
    }
  },

  actions: {
    onMouseEnter() {
      if (this.get('isDestroyed') || this.get('isDestroying')) { return; }
      this.set('showActions', true);
    },

    onMouseLeave() {
      if (this.get('isDestroyed') || this.get('isDestroying')) { return; }
      this.set('showActions', false);
    }
  }
});
