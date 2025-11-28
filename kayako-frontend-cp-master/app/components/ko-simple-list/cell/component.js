import { computed } from '@ember/object';
import Component from '@ember/component';
import { htmlSafe } from '@ember/string';

export default Component.extend({
  tagName: '',

  // Attributes
  disabled: false,
  width: null,

  computedStyles: computed('width', function() {
    return htmlSafe(this.get('width') ? `width: ${this.get('width')}` : 'flex-grow: 1; flex-shrink: 1; flex-basis: 0;');
  })
});
