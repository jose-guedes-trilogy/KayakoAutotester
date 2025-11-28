/* eslint-disable camelcase */

import {
  app,
  test,
} from 'frontend-cp/tests/helpers/qunit';

import sidebarItemStyles from 'frontend-cp/components/ko-search-sidebar/item/styles';
import tableRowStyles from 'frontend-cp/components/ko-table/row/styles';

app('Acceptance | Conversation | Search', {
  beforeEach() {
    useDefaultScenario();
    login();
  },

  afterEach() {
    logout();
  }
});

test('Search case returns result', function(assert) {
  visit('/agent/search/ERS%20Audit%207');

  andThen(function() {
    assert.equal(find(`.${tableRowStyles.container}`).length, 1);
  });
});

test('Change search result group', function(assert) {
  const term1 = 'Murray';
  visit(`/agent/search/${term1}`);

  andThen(function() {
    assert.equal(find(`.${tableRowStyles.container}`).length, 0);
  });

  click(`.${sidebarItemStyles.item}:eq(1)`);

  andThen(function() {
    assert.equal(find(`.${tableRowStyles.container}`).length, 20);
  });
});

test('Multiple searches in multiple tabs', function(assert) {
  const term1 = 'Murray';
  const term2 = 'ERS';
  visit(`/agent/search/${term1}`);

  andThen(function() {
    assert.equal(find('.qa-search-results-tab').length, 1);
    assert.equal(find('.qa-search-results-tab .active .qa-tab-label').text().trim(), term1);
  });

  andThen(function() {
    visit('/agent');
  });

  andThen(function() {
    visit(`/agent/search/${term2}`);
  });

  andThen(function() {
    assert.equal(find('.qa-search-results-tab').length, 2);
    assert.equal(find('.qa-search-results-tab .active .qa-tab-label').text().trim(), term2);
  });
});
