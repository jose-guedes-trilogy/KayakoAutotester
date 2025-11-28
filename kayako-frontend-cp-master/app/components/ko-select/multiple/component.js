import { not } from '@ember/object/computed';
import Component from '@ember/component';

export default Component.extend({
  // Attributes
  allowCreate: false,
  disabled: false,
  onChange: null,
  onValueAddition: null,
  onValueRemoval: null,
  onSuggestion: null,
  options: null,
  renderInPlace: false,
  matchTriggerWidth: true,
  searchField: 'name',
  placeholder: '',
  selected: [],
  allowAddDuringSearch: false,

  // State
  focused: false,

  // CPs
  searchOnly: not('options.length'),

  focusIn() {
    this.set('focused', true);
  },

  focusOut() {
    this.set('focused', false);
  }
});
