import { run } from '@ember/runloop';
import { observer } from '@ember/object';
import { isBlank } from '@ember/utils';
import Trigger from 'ember-power-select/components/power-select-multiple/trigger';
import jQuery from 'jquery';
import layout from './template';
import dispatchEvent from 'frontend-cp/utils/dispatch-event';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

export default Trigger.extend({
  layout,

  // Observers
  isOpenObserver: observer('select.isOpen', function() {
    let isOpen = this.get('select.isOpen');
    let wasOpen = this.get('wasOpen');

    if (!wasOpen && isOpen) {
      this._openedAt = new Date();
      run.schedule('afterRender', this, function() {
        jQuery(`#ember-power-select-multiple-options-${this.get('select.uniqueId')} input`).focus();
      });
    }

    this.set('wasOpen', isOpen);
  }),

  // Actions
  actions: {
    keepOpened(e) {
      if (this.get('select.isOpen')) {
        e.stopPropagation();
      }
    },

    handleBlur(e) {
      // We fake an enter keydown event here so it goes through the
      // usual power-select path of making a selection.
      // wiring up the blur event would require a fair bit of extra
      // code and the end result is the same.
      let select = this.get('select');
      if (select.isOpen && select.highlighted) {
        if (new Date() - this._openedAt < 200) {
          return;
        }
        dispatchEvent(e.target, 'keydown', { keyCode: KeyCodes.enter });
      } else if (select.results.length === 0 && !isBlank(select.searchText)) {
        dispatchEvent(e.target, 'keydown', { keyCode: KeyCodes.enter });
      }
    }
  }
});
