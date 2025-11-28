import Component from '@ember/component';
import { set, get, computed } from '@ember/object';

export default Component.extend({
  tagName: '',
  automationAction: null, // mandatory
  definition: null, // mandatory
  smallSlotClass: '',
  bigSlotClass: '',

  requiresValue: computed('automationAction.option', function() {
    let operator = this.get('automationAction.option');
    return ['CHANGE', 'ADD', 'REMOVE', 'REPLACE'].includes(operator);
  }),

  // Lifecycle hooks
  didReceiveAttrs() {
    this._super(...arguments);

    let availableOptions = get(this, 'definition.options');
    let option = get(this, 'automationAction.option');
    if (get(availableOptions, 'length') === 1) {
      set(this, 'automationAction.option', get(this, 'definition.options.firstObject'));
    } else if (availableOptions.indexOf(option) === -1) {
      set(this, 'automationAction.option', null);
    }
  }
});
