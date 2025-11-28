import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  // Attributes
  model: null,
  processingOrg: false,
  removedOrg: null,

  // CPs
  hasOrganization: computed.readOnly('model.requester.organization.name'),
  hasUser: computed.readOnly('model.requester.id'),

  actions: {
    triggerSetOrganization(event) {
      event.stopImmediatePropagation();
      event.preventDefault();
      this.sendAction('setOrganizationModeOn');
    }
  }
});
