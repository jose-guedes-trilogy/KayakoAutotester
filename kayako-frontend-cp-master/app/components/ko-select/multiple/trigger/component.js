import Trigger from 'ember-power-select/components/power-select-multiple/trigger';
import layout from './template';
import dispatchEvent from 'frontend-cp/utils/dispatch-event';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import { isBlank } from '@ember/utils';

export default Trigger.extend({
  layout,

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
      if ((this.get('isEmpty') || select.isOpen) && !isBlank(select.searchText)) {
        dispatchEvent(e.target, 'keydown', { keyCode: KeyCodes.enter });
      }
    }
  }
});
