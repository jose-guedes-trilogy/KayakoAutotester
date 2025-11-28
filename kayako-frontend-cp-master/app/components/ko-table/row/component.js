import { readOnly } from '@ember/object/computed';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',
  rowContext: null,
  clickable: false,

  // TODO BUG when component is reusing existing dom (via Glimmer), selectable
  // will be undefined
  selectable: readOnly('parentView.parentView.selectable'),
  selected: false,
  selectableDisabled: false,

  // Lifecycle hooks

  // Actions
  actions: {
    toggleRow(value, e) {
      if (!this.get('selectableDisabled')) {
        this.toggleProperty('selected');
        let action = this.get('onSelectChange');
        if (action) {
          action(this.get('selected'), e.shiftKey);
        }
      }
    },

    handleClick(event) {
      if (this.get('clickable')) {
        const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey;
        this.attrs.onClick(this.get('rowContext'), hasModifier);
      }
    }
  }
});
