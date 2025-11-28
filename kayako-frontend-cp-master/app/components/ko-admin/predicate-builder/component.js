import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  //Params:
  definitions: [],
  collections: [],
  onCollectionAddition: null,
  onCollectionRemoval: null,
  onAdditionOfPropositionToCollection: null,
  onPropositionDeletion: null,
  onPropositionChange: null,
  disabled: false,

  actions: {
    onPropositionChange(collection, proposition) {
      if (this.get('onPropositionChange')) {
        return this.get('onPropositionChange')(collection, proposition);
      }
    }
  }
});
