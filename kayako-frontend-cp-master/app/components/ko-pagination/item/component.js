import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  // Attributes
  page: null,
  isActive: false,

  qaCls: computed('page', function() {
    return `qa-pagination-${this.get('page')}`;
  })
});
