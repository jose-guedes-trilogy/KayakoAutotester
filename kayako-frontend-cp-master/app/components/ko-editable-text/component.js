import Component from '@ember/component';
import { run } from '@ember/runloop';
import { computed } from '@ember/object';
import jQuery from 'jquery';
import { guidFor } from '@ember/object/internals';

import * as KeyCodes from 'frontend-cp/lib/keycodes';

export default Component.extend({
  tagName: 'span',

  //Params:
  onValueChange: null,
  placeholder: null,
  value: null,
  isErrored: false,
  isKREEdited: false,
  isDisabled: false,
  size: 'medium',       // medium | large
  showPencilOnOver: false,
  onKeyDown: () => {},

  isEditing: false,
  isEdited: false,
  qaClass: null,
  labelComponent: null,

  // CPs
  isEmpty: computed.not('value'),
  displayText: computed.or('value', 'placeholder'),
  valueToSave: computed('value', {
    get() { return this.get('value'); },
    set(_, v) { return v; }
  }),
  iconSize: computed('size', function() {
    return this.get('size') === 'large' ? 16 : 12;
  }),

  inputId: computed(function () {
    return `${guidFor(this)}-id`;
  }),

  // Actions
  actions: {
    edit() {
      if (!this.get('isDisabled')) {
        this.startEditing();
      }
    },

    handleKeyDown(e) {
      if (e.keyCode === KeyCodes.enter) {
        this.stopEditing();
      }
      this.sendAction('onKeyDown', e);
    },

    handleFocusOut() {
      this.stopEditing();
    }
  },

  startEditing() {
    this.set('isEditing', true);
    this.set('valueToSave', this.get('value'));
    run.scheduleOnce('afterRender', this, () => {
      jQuery(`#${this.get('inputId')}`).focus();
    });
  },

  stopEditing() {
    this.set('isEditing', false);

    if (this.get('onValueChange')) {
      this.sendAction('onValueChange', this.get('valueToSave'));
    } else {
      this.set('value', this.get('valueToSave'));
    }
  }
});
