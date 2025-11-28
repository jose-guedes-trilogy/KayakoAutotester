import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    transitionToNewlyCreatedCase() {
      this.target.send('transitionToNewlyCreatedCase', ...arguments);
    }
  }
});
