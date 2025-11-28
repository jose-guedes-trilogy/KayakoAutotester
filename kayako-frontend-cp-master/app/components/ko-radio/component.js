import { guidFor } from '@ember/object/internals';
import Component from '@ember/component';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

export default Component.extend({
  tagName: '',

  // Attributes
  label: '',
  checked: false,
  onChange: () => {},
  qaClass: null,
  disabled: false,

  // State
  uniqueId: null,

  init() {
    this._super(...arguments);
    this.uniqueId = guidFor(this);
  },

  // Actions
  actions: {
    keyDown(e) {
      if (e.keyCode === KeyCodes.space) {
        e.preventDefault();
      }
    },

    keyUp(e) {
      if (e.keyCode === KeyCodes.space) {
        this.get('onChange')(true);
        e.preventDefault();
      }
    }
  }
});
