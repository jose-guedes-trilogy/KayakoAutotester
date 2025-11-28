import Component from '@ember/component';

export default Component.extend({
  tagName: '',
  allRowsSelected: false,
  selectable: false,

  actions: {
    selectAll(value) {
      let allRowsSelected = this.get('allRowsSelected');

      if (allRowsSelected) {
        this.get('onDeselectAll')();
      } else {
        this.get('onSelectAll')();
      }
    }
  }
});
