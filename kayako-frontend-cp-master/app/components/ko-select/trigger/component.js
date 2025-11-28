import $ from 'jquery';
import Component from '@ember/component';
import { run } from '@ember/runloop';
import { observer } from '@ember/object';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

export default Component.extend({
  // HTML
  tagName: '',

  // Observers
  isOpenObserver: observer('select.isOpen', function() {
    let select = this.get('select');
    let oldIsOpen = this.get('oldIsOpen');

    if (!oldIsOpen && select.isOpen) {
      run.schedule('afterRender', this, function() {
        $(`#ko-select-trigger-${this.get('select.uniqueId')} input`).focus();
      });
    } else if (oldIsOpen && !select.isOpen) {
      run.schedule('actions', null, select.actions.search, '');
    }

    this.set('oldIsOpen', select.isOpen);
  }),

  // Actions
  actions: {
    onKeydown(e) {
      let onKeydown = this.get('onKeydown');
      if (onKeydown && onKeydown(e) === false) {
        e.stopPropagation();
        return false;
      }
      if (e.keyCode === KeyCodes.space) {
        e.stopPropagation();
      }
    },

    keepOpened(e) {
      if (this.get('select.isOpen')) {
        e.stopPropagation();
      }
    }
  }
});
