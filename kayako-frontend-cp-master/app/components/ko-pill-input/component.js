import Component from '@ember/component';
import { computed } from '@ember/object';
import jQuery from 'jquery';
import { guidFor } from '@ember/object/internals';

export default Component.extend({
  // HTML
  localClassNames: ['view'],

  // Attributes
  isDisabled: false,
  onValueAddition: null,
  onValueRemoval: null,
  placeholder: '',
  searchField: 'name',
  value: [],
  qaClass: null,
  size: 'medium', // possible values: small, medium, full

  // State
  focused: false,

  focusIn() {
    this.set('focused', true);
  },

  focusOut() {
    this.set('focused', false);
  },

  inputId: computed(function () {
    return `${guidFor(this)}-id`;
  }),

  actions: {
    onClick() {
      jQuery(`#${this.get('inputId')}`).focus();
    }
  }
});
