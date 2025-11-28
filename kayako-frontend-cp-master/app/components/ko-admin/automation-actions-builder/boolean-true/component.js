import BaseComponent from '../base/component';

export default BaseComponent.extend({
  // Lifecycle hooks
  didReceiveAttrs() {
    this._super(...arguments);
    this.set('automationAction.value', 'true');
  }
});
