import { computed } from '@ember/object';
import Component from '@ember/component';

const LINKS_EITHER_SIDE_OF_CURRENT_PAGE = 2;

export default Component.extend({
  tagName: '',
  currentPage: 1,
  pageCount: 1,

  pagesToDisplay: computed('currentPage', 'pageCount', function() {
    const currentPage = this.get('currentPage');
    const lastPage = this.get('pageCount');
    let left = currentPage - LINKS_EITHER_SIDE_OF_CURRENT_PAGE;
    let right = currentPage + LINKS_EITHER_SIDE_OF_CURRENT_PAGE + 1;
    let range = [];
    let rangeWithDots = [];
    let l;

    for (let i = 1; i <= lastPage; i++) {
      if (i === 1 || i === lastPage || i >= left && i < right) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  })
});
