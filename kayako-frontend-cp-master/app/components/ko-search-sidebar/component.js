import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  // Attributes
  resultGroup: null,
  totalCounts: null,
  selectedCaseIds: null,
  onSelect: () => {},
  bulkUpdateComplete: () => {},
  clearSelectedCaseIds: () => {},

  //CPs
  _selectedCaseIds: computed.alias('selectedCaseIds')
});
