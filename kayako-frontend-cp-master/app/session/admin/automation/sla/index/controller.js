import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    transitionToSla(sla) {
      this.transitionToRoute('session.admin.automation.sla.edit', sla.id);
    },

    transitionToNewSla() {
      this.transitionToRoute('session.admin.automation.sla.new');
    }
  }
});
