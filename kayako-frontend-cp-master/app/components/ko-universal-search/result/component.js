import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  store: service(),
  result: null,
  showAppendIcon: false,
  showRemoveIcon: false,
  isReadOnly: false,
  isHighlighted: false,
  onSelectHighlightedResult: null,
  onHighlight: null,
  onHighlightPreviousResult: null,
  onStopSearch: null,
  onClickRemoveIcon: null,
  href: null,
  appended: false,

  tagName: '',

  resultComponent: computed('result.resource', function() {
    switch (this.get('result.resource')) {
      case 'article': return 'ko-universal-search/result/article';
      case 'case': return 'ko-universal-search/result/case';
      case 'organization': return 'ko-universal-search/result/organization';
      case 'user': return 'ko-universal-search/result/user';
    }
  }),

  actions: {
    handleClick(event) {
      if (!this.get('isReadOnly')) {
        if (this.get('showAppendIcon')) {
          this.toggleProperty('appended');
          if (this.get('appended')) {
            this.attrs.onSelectHighlightedResult('ADD', this.get('result'));
          } else {
            this.attrs.onSelectHighlightedResult('REMOVE', this.get('result'));
          }
        } else if (this.get('showRemoveIcon')) {
          this.set('appended', false);
          this.attrs.onSelectHighlightedResult('REMOVE', this.get('result'));
        } else {
          if (this.get('result.resource') === 'article') {
            const article = this.get('store').peekRecord('article', this.get('result.resultData.id'));
            return this.set('href', (article.get('helpcenterUrl') || ('/article/' + article.get('id'))));
          }

          event.preventDefault();

          const hasModifier = event.metaKey || event.ctrlKey || event.shiftKey;
          this.attrs.onSelectHighlightedResult(hasModifier);
          if (!hasModifier && this.attrs.onStopSearch) {
            this.attrs.onStopSearch();
          }
        }
      }
    },

    highlightResult() {
      if (this.attrs.onHighlight) {
        this.attrs.onHighlight(this.get('result'));
      }
    }
  }
});
