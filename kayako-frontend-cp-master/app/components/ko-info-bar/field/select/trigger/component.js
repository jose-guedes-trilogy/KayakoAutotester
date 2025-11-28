import $ from 'jquery';
import Component from '@ember/component';
import { get, observer, computed } from '@ember/object';
import { run } from '@ember/runloop';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

export default Component.extend({
  // Attributes
  extra: null,
  select: null,

  // HTML
  tagName: '',

  // Observers
  isOpenObserver: observer('select.isOpen', function() {
    let select = this.get('select');
    let oldIsOpen = this.get('oldIsOpen');

    if (!oldIsOpen && select.isOpen) {
      run.schedule('afterRender', this, function() {
        $(`#ko-info-bar-select-trigger-${this.get('select.uniqueId')} input`).focus();
      });
    } else if (oldIsOpen && !select.isOpen) {
      run.schedule('actions', null, select.actions.search, '');
    }

    this.set('oldIsOpen', select.isOpen);
  }),

  // CPs
  value: computed('extra.labelPath', 'select.isOpen', 'select.selected', 'extra.formattedValue', function() {
    let isOpen = this.get('select.isOpen');
    if (isOpen) { return ''; }
    let formattedValue = this.get('extra.formattedValue');
    if (formattedValue) { return formattedValue; }
    let selected = this.get('select.selected');
    if (!selected) { return '-'; }
    let labelPath = this.get('extra.labelPath');
    if (labelPath) {
      return get(selected, labelPath);
    } else {
      return selected;
    }
  }),

  actions: {
    handleMouseDown(e) {
      if (this.get('select.isOpen')) {
        e.stopPropagation();
      }
    },

    handleKeyDown(e) {
      let select = this.get('select');
      if (e.keyCode === KeyCodes.enter && select.isOpen) {
        select.actions.choose(select.highlighted, e);
        e.stopPropagation();
      }
      // Don't use space to select currently highlighed option
      if (e.keyCode === KeyCodes.space && select.isOpen) {
        e.stopPropagation();
      }
      if (!this.get('select.isOpen') && e.keyCode !== KeyCodes.tab && e.keyCode !== KeyCodes.enter) {
        e.preventDefault();
      }
    }
  }
});
