import EmberObject from '@ember/object';
import { A } from '@ember/array';
import Component from '@ember/component';
import { dasherize } from '@ember/string';
import { computed } from '@ember/object';

export default Component.extend({
  articles: null,

  columnList: A([
    EmberObject.create({id: 'title', name: 'title'}),
    EmberObject.create({id: 'upvote-count', name: 'upvote-count'}),
    EmberObject.create({id: 'view-count', name: 'view-count'}),
    EmberObject.create({id: 'comment-count', name: 'comment-count'})
  ]),

  articleSorting: ['upvote_count:desc'],
  sortedArticles: computed.sort('articles', 'articleSorting'),

  maxWidthForColumn(columnName) {
    if (['upvote-count', 'view-count', 'comment-count'].indexOf(columnName) !== -1) {
      return 80;
    }

    return null;
  },

  componentForHeader(column) {
    return `ko-insights/articles-list/header/${dasherize(column.get('name'))}`;
  },

  componentForColumn(column) {
    return `ko-insights/articles-list/column/${dasherize(column.get('name'))}`;
  }
});
