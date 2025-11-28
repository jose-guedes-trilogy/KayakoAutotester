import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    onClose() {
      this.transitionToRoute('session.admin.apps.endpoints');
    }
  }
});
