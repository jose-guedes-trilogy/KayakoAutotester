import Component from '@ember/component';
import { computed } from '@ember/object';
import isSystemTag from 'frontend-cp/utils/is-system-tag';

export default Component.extend({
  // Attributes
  all: null,
  select: null,
  option: null,
  searchField: null,
  removable: true,

  isRemovable: computed('option', 'removable', function() {
    return this.get('removable') && !isSystemTag(this.get('option'));
  }),

  // HTML
  tagName: '',

  actions: {
    remove(object, e) {
      e.stopPropagation();
      e.preventDefault();
      const select = this.get('select');
      select.actions.choose(object);
    }
  }
});
