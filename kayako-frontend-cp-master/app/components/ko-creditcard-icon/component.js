import { computed } from '@ember/object';
import Component from '@ember/component';
import { htmlSafe } from '@ember/string';

export default Component.extend({
  tagName: 'span',
  iconDiff: 39,
  types: ['VISA', 'DISCOVER', 'AMERICANEXPRESS', 'MASTER'],
  iconStyles: computed('type', function () {
    const typeIndex = this.get('types').indexOf(this.get('type'));
    const diff = typeIndex === 1 ? this.get('iconDiff') : (this.get('iconDiff') * typeIndex);
    return htmlSafe(`background-position: -${diff}px`);
  })
});
