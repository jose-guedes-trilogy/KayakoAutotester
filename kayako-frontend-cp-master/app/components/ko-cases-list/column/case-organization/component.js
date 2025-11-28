import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default Component.extend({
  tagName: '', // Render without a wrapping element

  // The case model passed into the component
  model: null,

  caseOrganization: reads('model.organization'),
  requesterOrganization: reads('model.requester.organization'),

  /**
   * Determines the organization name to display.
   * Priority: Case Organization > Requester Organization
   */
  displayOrganizationName: computed('caseOrganization.name', 'requesterOrganization.name', function() {
    return this.get('caseOrganization.name') || this.get('requesterOrganization.name');
  })
});
