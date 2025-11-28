import { inject as service } from '@ember/service';
import { filterBy } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  // Attributes
  caseFields: [],
  availableCaseFields: [],
  onCaseFieldAddition: () => {},
  onCaseFieldRemoval: () => {},
  onUpdate: () => {},

  // Services
  store: service(),

  systemCaseFields: filterBy('caseFields', 'isSystem', true),

  customCaseFields: filterBy('caseFields', 'isSystem', false),

  unusedCaseFields: computed('caseFields.[]', 'availableCaseFields.@each.isSystem', function() {
    let usedFields = this.get('caseFields');

    return this.get('availableCaseFields').filter(field => {
      return usedFields.indexOf(field) === -1;
    });
  }),

  actions: {
    reorderFields(reorderedFields) {
      this.get('onUpdate')(reorderedFields);
    }
  }
});
