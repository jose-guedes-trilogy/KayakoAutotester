import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    setUserFieldType(fieldType) {
      this.transitionToRoute('session.admin.customizations.organization-fields.new', fieldType);
    },

    transitionToIndexRoute() {
      this.transitionToRoute('session.admin.customizations.organization-fields.index');
    }
  }
});
