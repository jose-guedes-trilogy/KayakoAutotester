import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default Component.extend({
  // Attrs
  tagName: '',

  width: null,
  height: '10px',
  margin: null,

  // CP's
  inlineStyles: computed('width', 'height', 'margin', function() {
    return htmlSafe(`width:${this.get('width')}; height:${this.get('height')}; margin:${this.get('margin')};`);
  })
});
