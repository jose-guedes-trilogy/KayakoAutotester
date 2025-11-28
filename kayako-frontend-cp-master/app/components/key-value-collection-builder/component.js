import Component from '@ember/component';

export default Component.extend({
  // Attributes
  collection: null,
  name: 'key-value-builder',
  keyPlaceholder: null,
  valuePlaceholder: null,
  add: () => {},
  remove: () => {},
  updatePair: () => {}
});
