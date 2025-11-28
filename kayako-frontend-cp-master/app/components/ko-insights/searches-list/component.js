import EmberObject from '@ember/object';
import { A } from '@ember/array';
import Component from '@ember/component';
import { dasherize } from '@ember/string';
import { computed } from '@ember/object';

export default Component.extend({
  searches: null,

  columnList: A([
    EmberObject.create({id: 'query', name: 'query'}),
    EmberObject.create({id: 'count', name: 'count'})
  ]),

  searchSorting: ['attempt_count:desc'],
  sortedSearches: computed.sort('searches', 'searchSorting'),

  maxWidthForColumn(columnName) {
    if (columnName === 'count') {
      return 80;
    }

    return null;
  },

  componentForHeader(column) {
    return `ko-insights/searches-list/header/${dasherize(column.get('name'))}`;
  },

  componentForColumn(column) {
    return `ko-insights/searches-list/column/${dasherize(column.get('name'))}`;
  }
});
