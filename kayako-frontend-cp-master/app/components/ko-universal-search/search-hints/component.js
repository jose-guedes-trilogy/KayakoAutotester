import Component from '@ember/component';

export default Component.extend({
  tagName: '',
  recentSearches: [],
  highlightedSuggestion: null,
  onHighlight: () => {},
  onSelectSuggestion: () => {}
});
