import Component from '@ember/component';

export default Component.extend({
  // Attributes
  tagName: '',
  invalidState: null,
  entity: null,
  isProcessRunning: false,
  iconComponent: null,
  helpText: null,
  showAddOption: false,
  inUserMode: false,

  actions: {
    dispatch(method, ...rest) {
      this.sendAction(method, ...rest);
    }
  }
});
