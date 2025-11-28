import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  // Attributes
  model: null,

  // CPs
  hasOrganization: computed.readOnly('model.organization.name'),

  actions: {
    triggerSetOrganization(event) {
      event.stopImmediatePropagation();
      event.preventDefault();
      this.sendAction('setOrganizationModeOn');
    }
  }
});
