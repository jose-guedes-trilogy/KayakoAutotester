import Controller from '@ember/controller';

export default Controller.extend({
  isEdited() {
    return this.get('editComponent').isEdited();
  }
});
