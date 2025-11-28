import { readOnly } from '@ember/object/computed';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',
  onClick: null,
  minWidth: null,
  maxWidth: null,
  compact: false,
  dasherize: false,

  // CPs
  selectable: readOnly('parentView.selectable'),

  cellStyle: computed('width', function() {
    const maxWidth = this.get('maxWidth');
    const minWidth = this.get('minWidth');
    let styles = minWidth ? `min-width: ${minWidth}px;` : '';
    styles += maxWidth ? ` max-width: ${maxWidth}px;` : '';
    return htmlSafe(styles);
  }),

  actions: {
    handleClick(event) {
      const onClick = this.get('onClick');
      if (onClick) {
        event.preventDefault();
        event.stopPropagation();
        onClick(event);
      }
    }
  }
});
