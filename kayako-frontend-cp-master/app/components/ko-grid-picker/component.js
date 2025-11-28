import { isNone } from '@ember/utils';
import { computed } from '@ember/object';
import { on } from '@ember/object/evented';
import Component from '@ember/component';
import _ from 'npm:lodash';

export default Component.extend({
  tagName: '',

  // Attributes
  initialGrid: null,
  legend: null,

  // State
  grid: null,
  startRow: null,
  startCol: null,
  prevRow: null,
  prevCol: null,
  rowCount: null,
  colCount: null,

  isSelecting: false,

  gridCopy: null,

  initGrid: on('init', function() {
    const initialGrid = this.get('initialGrid');
    this.set('rowCount', initialGrid.get('length'));
    this.set('colCount', _.max(initialGrid.map((row) => row.length)));
    this.set('grid', this.getFreshGrid(initialGrid));
  }),

  cols: computed('colCount', function() {
    return _.range(this.get('colCount'));
  }),

  displayLegend: computed('legend.[]', function() {
    if (this.get('legend.length')) {
      return this.get('legend');
    } else {
      return this.get('cols');
    }
  }),

  getFreshGrid(grid) {
    return _.range(this.get('rowCount')).map((index) => {
      return this.get('cols').map((hour) => {
        return grid[index][hour];
      });
    });
  },

  toggleCell(grid, row, col) {
    const isSelected = this.get('gridCopy')[row][col];
    grid[row][col] = !isSelected;
  },

  isPrevCell(row, col) {
    return row === this.get('prevRow') && col === this.get('prevCol');
  },

  highlightRegion(startRow, startCol, endRow, endCol) {
    if (startRow > endRow) {
      [startRow, endRow] = [endRow, startRow];
    }
    if (startCol > endCol) {
      [startCol, endCol] = [endCol, startCol];
    }

    const grid = this.getFreshGrid(this.get('gridCopy'));

    for (let i = startRow; i <= endRow; i++) {
      for (let j = startCol; j <= endCol; j++) {
        this.toggleCell(grid, i, j);
      }
    }
    this.set('grid', grid);
  },

  actions: {
    handleMouseUp() {
      this.set('isSelecting', false);
      this.attrs.onRangeSelect(this.get('grid'));
    },

    handleMouseDown(event) {
      event.preventDefault();
      const target = event.target;
      if (isNone(target.dataset.row) || isNone(target.dataset.col)) {
        return;
      }

      const row = parseInt(target.dataset.row, 10);
      const col = parseInt(target.dataset.col, 10);

      this.set('gridCopy', this.getFreshGrid(this.get('grid')));

      this.set('isSelecting', true);
      this.set('startRow', row);
      this.set('startCol', col);
      this.set('prevRow', row);
      this.set('prevCol', col);

      this.highlightRegion(row, col, row, col);
    },

    handleMouseMove(event) {
      const target = event.target;
      if (isNone(target.dataset.row) || isNone(target.dataset.col)) {
        return;
      }
      const row = parseInt(target.dataset.row, 10);
      const col = parseInt(target.dataset.col, 10);

      if (this.get('isSelecting') && !this.isPrevCell(row, col)) {
        this.highlightRegion(this.get('startRow'), this.get('startCol'), row, col);
        this.set('prevRow', row);
        this.set('prevCol', col);
      }
    }
  }
});
