import { getOwner } from '@ember/application';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import sanitizeInitializer from 'frontend-cp/initializers/setup-sanitizers';

moduleForComponent('ko-universal-search/search-hints', 'Integration | Component | ko-universal-search/search-hints', {
  integration: true,

  beforeEach() {
    let intl = getOwner(this).lookup('service:intl');
    intl.setLocale('en-us');
    sanitizeInitializer.initialize(this.container.registry);
  }
});

test('with malicious search suggestions', function(assert) {
  this.set('suggestedSearchOptions', [{
    markedUpSearchTerm: '<b>requester:</b><script>console.log("PWNED")</script>'
  }]);

  this.render(hbs`
    {{ko-universal-search/search-hints
      suggestedSearchOptions=suggestedSearchOptions}}
  `);

  assert.equal(
    this.$('.qa-ko-universal-search_search-hints__suggestion').html(),
    '<b>requester:</b>console.log("PWNED")',
    'sanitizes suggestions whilst keeping bold tags'
  );
});
