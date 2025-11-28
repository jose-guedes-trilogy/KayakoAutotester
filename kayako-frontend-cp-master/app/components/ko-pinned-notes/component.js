import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { scheduleOnce } from '@ember/runloop';

export default Component.extend({
  // Attributes:
  tagName: '',
  model: null,
  fetchNotes: () => {},  // Defined in components where ko-pinned-notes is called in.

  init() {
    this._super(...arguments);
    scheduleOnce('afterRender', this, 'runFetchNotes');
  },

  runFetchNotes() {
    this.get('fetchNotes').perform();
  },

  // Services
  i18n: service(),
  store: service(),

  // CPs
  pinnedNotesCount: computed('model.viewNotes.@each.isPinned', function () {
    if (this.get('model.viewNotes')) {
      return this.get('model.viewNotes').filterBy('isPinned').length;
    }
    return 0;
  }),

  pinnedNotesText: computed('pinnedNotesCount', function () {
    let count = this.get('pinnedNotesCount');
    count = (count > 9) ? '9+' : count;

    return this.get('i18n').t('generic.pinned_notes', { count });
  })
});
