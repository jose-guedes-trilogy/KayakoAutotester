import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // Attributes
  items: null,
  onReorder: null,
  reorderAvailable: true,
  handleOutside: false
});
