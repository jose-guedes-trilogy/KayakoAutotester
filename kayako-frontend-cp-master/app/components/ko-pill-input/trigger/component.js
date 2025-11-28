import Trigger from 'ember-power-select/components/power-select-multiple/trigger';
import layout from './template';
import dispatchEvent from 'frontend-cp/utils/dispatch-event';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import { isBlank } from '@ember/utils';

export default Trigger.extend({
  layout,

  actions: {
    onBlur(e) {
      let select = this.get('select');
      if (this.get('isEmpty') && !isBlank(select.searchText)) {
        // If we don't do this, the text in the input element won't be converted
        // into a pill, when we click outside the pill input
        dispatchEvent(e.target, 'keydown', { keyCode: KeyCodes.enter });
      }
    }
  }
});
