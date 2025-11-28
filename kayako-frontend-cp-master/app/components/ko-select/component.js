import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  // Services
  i18n: service(),

  // Attributes
  onChange: null,
  options: null,
  selected: null,
  size: null, // possible values: small, medium
  placeholder: null,
  disabled: false,
  initiallyOpened: false,
  matchTriggerWidth: true,
  search: null,
  searchEnabled: false,
  searchField: null,
  noMatchesMessage: null,
  qaClass: null,
  triggerField: null,
  beforeOptionsComponent: null,

  // State
  focused: false,

  // HTML
  focusIn() {
    this.set('focused', true);
  },

  focusOut() {
    this.set('focused', false);
  },

  // CPs
  triggerComponent: computed('options', function() {
    if (this.get('options') === null) {
      return 'ko-select/typeahead-trigger';
    } else {
      return 'ko-select/trigger';
    }
  }),

  defaultNoMatchesMessage: computed('i18n', function() {
    let i18n = this.get('i18n');
    return i18n.t('search.noresults');
  })
});
