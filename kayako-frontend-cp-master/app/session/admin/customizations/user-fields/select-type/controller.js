import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    // TODO: make this action to be generic across cases & users.
    setCaseFieldType(fieldType) {
      this.transitionToRoute('session.admin.customizations.user-fields.new', fieldType);
    },

    canceled() {
      this.transitionToRoute('session.admin.customizations.user-fields.index');
    }
  }
});
