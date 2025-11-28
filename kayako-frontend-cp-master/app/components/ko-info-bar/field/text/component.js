import $ from 'jquery';
import { guidFor } from '@ember/object/internals';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // Attributes
  title: '',
  isErrored: false,
  isEdited: false,
  isDisabled: false,
  isKREEdited: false,
  value: '',
  onValueChange: null,
  emptyLabel: '',

  // State
  isActive: false,
  uniqueId: null,

  init() {
    this._super(...arguments);
    this.uniqueId = guidFor(this);
  },

  actions: {
    click() {
      $(`#${this.get('uniqueId')}`).focus();
    },

    focus() {
      this.set('isActive', true);
    },

    blur() {
      this.set('isActive', false);
    }
  }
});
