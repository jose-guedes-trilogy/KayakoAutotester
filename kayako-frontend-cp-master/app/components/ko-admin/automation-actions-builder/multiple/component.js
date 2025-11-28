import { computed, get } from '@ember/object';
import { isBlank } from '@ember/utils';
import BaseComponent from '../base/component';

export default BaseComponent.extend({
  // CPs
  selected: computed('automationAction.value', function() {
    let value = get(this, 'automationAction.value');
    let ids = isBlank(value) ? [] : value.split(',').map(id => id.trim());
    return get(this, 'definition.values').filter(v => ids.indexOf(get(v, 'id')) > -1);
  }),

  // Actions
  actions: {
    updateValue(newSelection) {
      this.set('automationAction.value', newSelection.mapBy('id').join(','));
    }
  }
});
