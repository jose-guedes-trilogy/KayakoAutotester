import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  //Params:
  columns: null,
  availableColumns: null,

  onColumnAdd: () => {},
  onColumnRemove: () => {},
  onColumnReorder: () => {},

  unusedColumns: computed('availableColumns.[]', 'columns.[]', function() {
    let usedColumns = this.get('columns');
    if (!usedColumns) {
      return this.get('availableColumns');
    }

    return this.get('availableColumns').filter(availableColumn => {
      return !usedColumns.includes(availableColumn);
    }).sortBy('title');
  })
});
