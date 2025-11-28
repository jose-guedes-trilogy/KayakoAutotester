import Component from '@ember/component';

export default Component.extend({
  // Attributes
  collectionOperators: null,
  currentCollectionOperators: null,

  // State
  focused: false,

  // HTML
  focusIn() {
    this.set('focused', true);
  },

  focusOut() {
    this.set('focused', false);
  }
});
