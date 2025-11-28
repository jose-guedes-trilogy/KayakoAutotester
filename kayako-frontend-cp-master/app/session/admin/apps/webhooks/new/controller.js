import Controller from '@ember/controller';

export default Controller.extend({
  // Methods
  initEdits() {
    this.get('editComponent').initEdits();
  },

  isEdited() {
    return this.get('editComponent').isEdited();
  }
});
