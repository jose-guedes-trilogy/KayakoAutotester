import { run } from '@ember/runloop';
import { isBlank } from '@ember/utils';
import { observer } from '@ember/object';
import Trigger from 'ember-power-select/components/power-select-multiple/trigger';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import layout from './template';
import { validateEmailFormat as isEmail } from 'frontend-cp/utils/format-validations';

export default Trigger.extend({
  layout,

  // State
  oldSearchText: '',

  onCCInput: () => {},
  addImmediateCC: () => {},

  selectObserver: observer('select.searchText', function() {
    const select = this.get('select');
    const searchText = select.searchText;
    const oldSearchText = this.get('oldSearchText');
    if (isBlank(searchText) && !isBlank(oldSearchText)) {
      run.schedule('actions', null, select.actions.close, null, true);
    } else if (!isBlank(searchText) && isBlank(oldSearchText)) {
      run.schedule('actions', null, select.actions.open);
    }
    this.set('oldSearchText', searchText);
  }),

  actions: {
    stopPropagation(e) {
      e.stopPropagation();
    },

    handleKeydown(e) {
      let isSpecialKeyWhileClosed = !this.get('select.isOpen') && [KeyCodes.enter, KeyCodes.escape, KeyCodes.up, KeyCodes.down].indexOf(e.keyCode) > -1;
      if (isSpecialKeyWhileClosed) {
        e.stopPropagation();
      }
      else {
        if (e.keyCode === KeyCodes.enter && isEmail(this.get('select.searchText'))) {
          this.sendAction('addImmediateCC', e, this.get('select.searchText'), this.get('select'));
        }
        this.send('onKeydown', e);
      }
    }
  }
});
