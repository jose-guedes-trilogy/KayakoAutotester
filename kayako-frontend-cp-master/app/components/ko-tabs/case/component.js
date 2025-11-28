import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import he from 'npm:he';

export default Component.extend({
  tagName: '',

  // Attributes
  model: null,

  // CPs
  caseOrganization: reads('model.organization'),
  requesterOrganization: reads('model.requester.organization'),
  
  organizationName: computed('caseOrganization.name', 'requesterOrganization.name', function() {
    return this.get('caseOrganization.name') || this.get('requesterOrganization.name');
  }),
  
  hasOrganization: computed('organizationName', function() {
    return !!this.get('organizationName');
  }),
  hasUser: computed.readOnly('model.requester.id'),

  subject: computed('model.subject', function() {
     return he.unescape(this.get('model.subject'));
  }),
  
  actions: {
    triggerSetOrganization(event) {
      event.stopImmediatePropagation();
      event.preventDefault();
      this.sendAction('setOrganizationModeOn');
    }
  }
});
