import $ from 'jquery';
import Component from '@ember/component';
import { computed } from '@ember/object';
import WithUniqueId from 'frontend-cp/mixins/with-unique-id';
import { next } from '@ember/runloop';

export default Component.extend(WithUniqueId, {
  // Attributes
  name: null,
  value: '',
  onInput: null,
  onChange: null,
  onBlur: null,
  disabled: false,
  placeholder: null,
  autofocus: false,
  qaClass: null,
  type: 'text',
  size: 'medium', // possible values: small, medium, full
  multiline: false,
  lines: 4,
  monospace: false,
  customElementId: false,

  // HTML
  tagName: '',

  // Lifecycle hooks
  didInsertElement() {
    this._super(...arguments);
    next(() => this.performAutofocus());
  },

  id: computed(function () {
    if (this.get('customElementId')) {
      return this.get('elementId');
    }
    else {
      return this.get('uniqueId');
    }
  }),

  performAutofocus() {
    if (this.get('isDestroying') || this.get('isDestroyed')) {
      return;
    }

    if (this.get('autofocus')) {
      $(`#${this.get('uniqueId')}`).focus();
    }
  }
});
