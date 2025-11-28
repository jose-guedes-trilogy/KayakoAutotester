import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  item: null,
  isHighlighted: false,

  itemHasProperties: computed('item', function () {
    return typeof this.get('item') === 'object';
  })
});
