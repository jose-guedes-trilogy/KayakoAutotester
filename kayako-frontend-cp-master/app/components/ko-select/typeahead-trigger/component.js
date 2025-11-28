import { computed, observer } from '@ember/object';
import Component from '@ember/component';
import { run } from '@ember/runloop';
import { isBlank } from '@ember/utils';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

export default Component.extend({
  // HTML
  tagName: '',

  textValue: computed('select.selected', 'searchField', {
    get() {
      return this.get('select.selected.' + this.get('searchField'));
    },
    set(_, v) {
      return v;
    }
  }),

  // Lifecycle hooks
  selectObserver: observer('select.{loading,lastSearchedText}', function() {
    let {
      oldIsOpen, oldLoading, oldLastSearchedText
    } = this.getProperties('oldIsOpen', 'oldLoading', 'oldLastSearchedText');
    let select = this.get('select');
    let isOpen = this.get('select.isOpen');
    let results = this.get('select.results');
    let loading = this.get('select.loading');
    let searchText = this.get('select.searchText');
    let lastSearchedText = this.get('select.lastSearchedText');
    if (oldIsOpen && !isOpen && !loading && searchText) {
      this.set('textValue', this.get('select.selected.' + this.get('searchField')));
    }

    if (lastSearchedText !== oldLastSearchedText) {
      if (isBlank(lastSearchedText)) {
        run.schedule('actions', null, select.actions.close, null, true);
      } else {
        run.schedule('actions', null, select.actions.open);
      }
    } else if (!isBlank(lastSearchedText) && results.length === 0 && loading) {
      run.schedule('actions', null, select.actions.close, null, true);
    } else if (oldLoading && !loading && results.length > 0) {
      /*
       * Another edge case for re-searching for the same thing.
       * If we finished searching and there is something to show, always open the
       * select box
       */
      run.schedule('actions', null, select.actions.open);
    }
    this.setProperties({ oldIsOpen: isOpen, oldLoading: loading, oldLastSearchedText: lastSearchedText });
  }),

  // Actions
  actions: {
    stopPropagation(e) {
      e.stopPropagation();
    },

    handleKeydown(e) {
      let isLetter = e.keyCode >= KeyCodes.zero && e.keyCode <= KeyCodes.z || e.keyCode === KeyCodes.space; // Keys 0-9, a-z or SPACE
      let isSpecialKeyWhileClosed = !isLetter && !this.get('select.isOpen') && [KeyCodes.enter, KeyCodes.escape, KeyCodes.up, KeyCodes.down].indexOf(e.keyCode) > -1;
      if (isLetter || isSpecialKeyWhileClosed) {
        e.stopPropagation();
      }
    },

    handleInput(e) {
      // run the search action and update the value of the text box whenever we type
      this.get('select.actions.search')(e.target.value);
      this.set('textValue', e.target.value);
    }

  }
});
