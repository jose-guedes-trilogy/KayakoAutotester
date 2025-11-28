import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { htmlSafe } from '@ember/string';

export default Component.extend({
  tagName: '',

  column: null,
  orderBy: null,
  orderByColumn: null,
  sortable: false,
  maxWidth: null,
  minWidth: null,
  width: null,
  dense: false,

  // Services
  renderedTextWidth: service(),

  // CPs
  headingStyle: computed('width', function() {
    const maxWidth = this.get('maxWidth');
    const minWidth = this.get('minWidth');
    let styles = minWidth ? `min-width: ${minWidth}px;` : '';
    styles += maxWidth ? ` max-width: ${maxWidth}px;` : '';
    return htmlSafe(styles);
  }),

  selected: computed('orderByColumn', 'column.name', function() {
    return this.get('orderByColumn') === this.get('column.name');
  }),

  actions: {
    handleMouseDown(e) {
      if (this.get('sortable')) {
        e.preventDefault();
      }
    },

    handleClick() {
      if (!this.get('sortable')) {
        return null;
      }

      const onSort = this.get('onSort');
      const column = this.get('column');
      const selected = this.get('selected');
      const orderBy = this.get('orderBy');
      const direction = selected && orderBy === 'asc' ? 'desc' : 'asc';

      onSort(column, direction);
    }
  }
});
