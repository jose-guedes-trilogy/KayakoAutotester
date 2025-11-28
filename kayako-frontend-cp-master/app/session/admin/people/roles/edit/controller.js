import Controller from '@ember/controller';

export default Controller.extend({
  // Actions
  actions: {
    transitionToIndex() {
      this.transitionToRoute('session.admin.people.roles.index');
    }
  },

  // Methods
  isEdited() {
    let model = this.get('model');
    return model.get('hasDirtyAttributes') && Object.keys(model.changedAttributes()).length > 0;
  },

  initEdits() {
    this.get('model').rollbackAttributes();
  }
});
