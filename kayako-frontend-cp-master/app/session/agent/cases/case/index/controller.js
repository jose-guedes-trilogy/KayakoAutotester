import Controller from '@ember/controller';
import { computed } from '@ember/object';
import he from 'npm:he';

export default Controller.extend({
  queryParams: ['postId', 'filter', 'noteId'],
  filter: 'all',
  postId: null,
  noteId: null,

  caseSubject: computed('case.subject', function() {
    return he.unescape(this.get('case.subject'));
 }),

  // Actions
  actions: {
    updateQueryParams(changes) {
      this.setProperties(changes);
      return true;
    }
  }
});
