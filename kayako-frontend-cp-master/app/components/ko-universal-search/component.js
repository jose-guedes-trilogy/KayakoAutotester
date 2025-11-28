import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { bool } from '@ember/object/computed';
import jQuery from 'jquery';
import { task, timeout } from 'ember-concurrency';
import { guidFor } from '@ember/object/internals';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import styles from './styles';

import { variation } from 'ember-launch-darkly';

const QUERY_DEBOUNCE_INTERVAL = 500;

export default Component.extend(KeyboardShortcuts, {
  tagName: '',

  // Attributes
  groupSelect: false,
  displayInline: false,
  showSearchHints: true,
  showHelpBlock: true,
  showSeeMoreButton: true,
  searchWithin: null,
  resultsToExclude: null,
  onLoadSearchRoute: null,
  highlightInputOnFocus: false,
  hasInlineInputBorder: false,
  isFocused: false,
  onClose: () => {},
  onSeeMore: () => {},
  onSearchStateChange: () => {},

  // State
  searchQuery: null,
  highlightedResult: null,

  // Services
  i18n: service(),
  store: service(),
  metrics: service(),
  notification: service(),
  searchHistory: service(),
  universalSearch: service(),
  searchSuggestions: service(),

  keyboardShortcuts: {
    esc: 'closeSearch',
    down: 'highlightNextResult',
    up: 'highlightPreviousResult',
    enter: 'selectHighlightedResult'
  },

  init() {
    this._super(...arguments);
    if (!this.get('resultsToExclude')) {
      this.set('resultsToExclude', []);
    }
    this.handleRootMouseDown = this.handleRootMouseDown.bind(this);
  },

  didInsertElement() {
    self.document.body.addEventListener('mousedown', this.handleRootMouseDown, true);
    jQuery(`#${this.get('inputId')}`).focus();
  },

  willDestroyElement() {
    self.document.body.removeEventListener('mousedown', this.handleRootMouseDown, true);
  },

  // CPs
  elementGuid: computed(function() {
    return `ko-${guidFor(this)}`;
  }),

  inputId: computed('elementGuid', function() {
    return `${this.get('elementGuid')}-input`;
  }),

  searchResults: computed('doSearch.lastSuccessful.value', 'resultsToExclude.[]', function() {
    const records = this.get('doSearch.lastSuccessful.value');
    const resultsToExclude = this.get('resultsToExclude');

    if (!records) {
      return null;
    }

    let recordsOfValidResource = records.filter(record => {
      return ['organization', 'user', 'case', 'article'].indexOf(record.get('resource')) > -1;
    });

    let validRecordsWithExclusionsApplied = recordsOfValidResource.filter(valid => !resultsToExclude.some(excluded => {
      return valid.get('id') && excluded.id === valid.get('id').substr(valid.get('id').lastIndexOf('/') + 1) &&
        excluded.type === valid.get('resource');
    }));

    return validRecordsWithExclusionsApplied;
  }),

  searchActive: computed('searchQuery.length', function() {
    let searchQueryLength = this.get('searchQuery.length');
    if (searchQueryLength) {
      this.get('onSearchStateChange')(true);
      return true;
    } else {
      this.get('onSearchStateChange')(false);
      return false;
    }
  }),

  isSearching: bool('searchQuery'),

  searchQueryIsValid: computed.gte('searchQuery.length', 3),

  recentSearches: computed.readOnly('searchHistory.recentSearches'),

  suggestedSearchOptions: computed.readOnly('searchSuggestions.suggestedSearchOptions'),

  allSearchHints: computed('suggestedSearchOptions', 'recentSearches', function() {
    return this.get('suggestedSearchOptions').concat(this.get('recentSearches'));
  }),

  adjustScroll(highlightIndex, down = true) {
    const rowHeight = 64;
    const highlight = rowHeight * highlightIndex;
    const element = jQuery(`.${styles.list}`);

    if (down) {
      let offsetHeight = 5 * rowHeight;
      if ((highlight - element.scrollTop()) > offsetHeight) {
        element.scrollTop(highlight - offsetHeight);
      }
    } else {
      if (highlight < element.scrollTop()) {
        element.scrollTop(highlight);
      }
    }
  },

  doSearch: task(function * (value) {
    this.setProperties({
      searchQuery: value,
      highlightedResult: null
    });

    if (!this.get('searchQueryIsValid')) {
      return null;
    }

    yield timeout(QUERY_DEBOUNCE_INTERVAL);

    let searchResults = null;
    const searchWithin = this.get('searchWithin');

    if (searchWithin) {
      searchResults = yield this.get('universalSearch').search(`${searchWithin} ${value}`);
    } else {
      searchResults = yield this.get('universalSearch').search(value);
    }
    this.get('searchHistory').logSearch(value);
    return searchResults;
  }).restartable(),

  // Methods
  highlightNextResult() {
    const isSearching = this.get('isSearching');
    if (isSearching && !this.get('searchQueryIsValid')) {
      return;
    }

    let currentlyHighlightedResult = this.get('highlightedResult');
    let results = isSearching ? this.get('searchResults') : this.get('allSearchHints');

    if (!currentlyHighlightedResult) {
      this.set('highlightedResult', results.get('firstObject'));
      return;
    }

    let currentIndex = results.indexOf(currentlyHighlightedResult);
    if (currentIndex < results.get('length') - 1) {
      this.set('highlightedResult', results.objectAt(currentIndex + 1));
      this.adjustScroll(currentIndex + 1, true);
    }
  },

  highlightPreviousResult() {
    const isSearching = this.get('isSearching');
    if (isSearching && !this.get('searchQueryIsValid')) {
      return;
    }

    let currentlyHighlightedResult = this.get('highlightedResult');
    let results = isSearching ? this.get('searchResults') : this.get('allSearchHints');
    let currentIndex = results.indexOf(currentlyHighlightedResult);

    // back to the start if we try to go below the list
    if (currentIndex > 0) {
      this.set('highlightedResult', results.objectAt(currentIndex - 1));
      this.adjustScroll(currentIndex - 1, false);
    }
  },

  selectSearchSuggestion(suggestion) {
    if (typeof suggestion === 'object') {
      suggestion = suggestion.searchTerm;
    }

    this.set('searchQuery', suggestion);
    this.get('searchHistory').logSearch(suggestion);
    this.get('doSearch').perform(suggestion);
  },

  handleRootMouseDown(e) {
    if (!jQuery(`#${this.get('elementGuid')}`)[0].contains(e.target)) {
      this.closeSearch();
    }
  },

  closeSearch() {
    this.get('doSearch').perform('');
    this.set('searchQuery', null);
    this.get('onClose')();
  },

  actions: {
    highlightResult(highlightedResult) {
      this.set('highlightedResult', highlightedResult);
    },

    closeSearch() {
      this.closeSearch();
    },

    highlightNextResult() {
      this.highlightNextResult();
    },

    highlightPreviousResult() {
      this.highlightPreviousResult();
    },

    selectHighlightedSearchSuggestion(suggestion) {
      this.selectSearchSuggestion(suggestion);
    },

    updateMergeList(operation, result) {
      this.get('onLoadSearchRoute')(operation, result);
    },

    selectHighlightedResult(hasModifier) {
      let result = this.get('highlightedResult');
      if (!result) {
        return;
      }

      if (!this.get('isSearching')) {
        this.selectSearchSuggestion(result);
        return;
      }

      this.get('searchHistory').logSearch(this.get('searchQuery'));

      if (!hasModifier) {
        this.closeSearch();
      } else {
        let notificationText = this.get('i18n').t('cases.search.open_in_background', {title: result.get('title')});
        this.get('notification').success(notificationText);
      }

      if (variation('ops-event-tracking')) {
        this.get('metrics').trackEvent({
          event: 'Search - Open a result',
          category: 'Agent'
        });
      }

      const routes = {
        user: 'session.agent.users.user',
        case: 'session.agent.cases.case',
        organization: 'session.agent.organizations.organization'
      };

      const resourceType = result.get('resource');

      if (resourceType === 'article') {
        const article = this.get('store').peekRecord('article', result.get('resultData.id'));
        const $articleLink = jQuery('<a href="' + (article.get('helpcenterUrl') || ('/article/' + article.get('id'))) + '" target="_blank" rel="noopener noreferrer" style="visibility: hidden;"></a>');
        jQuery('body').append($articleLink);
        $articleLink.get(0).click();
        $articleLink.remove();
      } else {
        let route = routes[resourceType];
        this.get('onLoadSearchRoute')(route, result.get('resultData.content'), hasModifier);
      }
    },

    navigateSeeMore() {
    if (variation('ops-event-tracking')) {
      this.get('metrics').trackEvent({
        event: 'Search - Open advanced search',
        category: 'Agent'
      });
    }

      this.get('onSeeMore')(this.get('searchQuery'));
      this.closeSearch();
    }
  }
});
