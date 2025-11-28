import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // Attributes
  brand: null,
  list: null,
  onDelete: () => {},
  onEdit: () => {},
  onMakeDefault: () => {},
  onToggle: () => {}
});
