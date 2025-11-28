import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    setCaseFieldType(caseFieldType) {
      this.transitionToRoute('session.admin.customizations.case-fields.new', caseFieldType);
    },

    canceled() {
      this.transitionToRoute('session.admin.customizations.case-fields.index');
    }
  }
});
