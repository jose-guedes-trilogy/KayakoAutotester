import { computed } from '@ember/object';
import { isBlank } from '@ember/utils';
import BaseComponent from '../base/component';

export default BaseComponent.extend({
  // Lifecycle hooks
  init() {
    this._super(...arguments);
    this.originalValue = this.get('automationAction.value');
    this.payloadFormat = isBlank(this.originalValue) ? 'simple' : 'custom';
  },

  endpointContentTypeDescriptionIntlString: computed('definition.inputType', function() {
    switch (this.get('definition.inputType')) {
      case 'ENDPOINT_HTTP_XML':
        return 'admin.automation_actions_builder.endpoint_description.xml';
      case 'ENDPOINT_HTTP_JSON':
        return 'admin.automation_actions_builder.endpoint_description.json';
    }
  }),

  // Actions
  actions: {
    changePayloadFormat(v) {
      this.set('payloadFormat', v);
      if (v === 'custom') {
        this.set('automationAction.value', this.originalValue);
      } else if (v === 'simple') {
        this.originalValue = this.get('automationAction.value');
        this.set('automationAction.value', '');
      }
    }
  }
});
