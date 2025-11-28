import Component from '@ember/component';
import { htmlSafe } from '@ember/string';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',
  width: null,

  additionalStyles: computed('width', function() {
    if (this.get('width')) {
      return htmlSafe(`min-width: ${this.get('width')}px;`);
    }
  })
});
