import Component from '@ember/component';
import { computed } from '@ember/object';
import { get } from '@ember/object';
import { buildTreeFromList } from 'frontend-cp/components/ko-select/drill-down/component';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import { inject as service } from '@ember/service';

import { variation } from 'ember-launch-darkly';

export default Component.extend(KeyboardShortcuts, {
  metrics: service(),
  tagName: '',

  // Attributes
  onMacroSelect: null,
  isDisabled: false,
  macros: [],

  keyboardShortcuts: {
    'ctrl+alt+m': {
      action: 'open',
      global: false,
      preventDefault: true
    },
    m: {
      action: 'open',
      global: false
    }
  },

  // HTML
  classNames: ['ko-case_macro-selector'],

  // build a value list for the option drilldown
  macroValueList: computed('macros.[]', function() {
    return buildTreeFromList(this.get('macros'), item => ({
      id: get(item, 'id'),
      value: get(item, 'title'),
      object: item
    }));
  }),

  actions: {
    onMacroSelect({ object }) {
      this.attrs.onMacroSelect(object);

      if (variation('release-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'macro_applied',
          object: object.get('id'),
        });
      }
    },

    open() {
      this.get('drillDownComponent').send('open');
    }
  }
});
