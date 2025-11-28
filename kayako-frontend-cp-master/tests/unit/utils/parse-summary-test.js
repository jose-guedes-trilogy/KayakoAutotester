import { module, test } from 'qunit';

import parseSummary from 'frontend-cp/utils/parse-summary';

module('Unit | Utility | parseSummary');

test('parses tokens into text, actors and entities', function(assert) {
  const tokens = parseSummary('<@https://brewfictus.kayako.com/Base/User/12|Gary Test> created something <https://brewfictus.kayako.com/Base/Case/14|A Conversation>');

  assert.equal(tokens.length, 3);

  assert.deepEqual(tokens[0], {
    type: 'actor',
    content: 'Gary Test',
    url: '/agent/users/12'
  });

  assert.deepEqual(tokens[1], {
    type: 'text',
    content: 'created something'
  });

  assert.deepEqual(tokens[2], {
    type: 'entity',
    content: 'A Conversation',
    url: '/agent/conversations/14'
  });
});

test('parses tokens without URLs', function(assert) {
  const tokens = parseSummary('<@|Gary Test> created something <|A Conversation>');

  assert.equal(tokens.length, 3);

  assert.deepEqual(tokens[0], {
    type: 'actor',
    content: 'Gary Test',
    url: null
  });

  assert.deepEqual(tokens[1], {
    type: 'text',
    content: 'created something'
  });

  assert.deepEqual(tokens[2], {
    type: 'entity',
    content: 'A Conversation',
    url: null
  });

});

test('converts API user URLs to local URLs', function(assert) {
  const tokens = parseSummary('<@https://brewfictus.kayako.com/Base/User/12|Gary Test>');
  assert.equal(tokens[0].url, '/agent/users/12');
});

test('converts API case URLs to local URLs', function(assert) {
  const tokens = parseSummary('<@https://brewfictus.kayako.com/Base/Case/42|Some Case>');
  assert.equal(tokens[0].url, '/agent/conversations/42');
});

test('leaves local URLs alone', function(assert) {
  const tokens = parseSummary('<@https://brewfictus.kayako.com/agent/conversations/12|Some Case>');
  assert.equal(tokens[0].url, '/agent/conversations/12');
});

test('ignores unrecognized URLs', function(assert) {
  const tokens = parseSummary('<@https://brewfictus.kayako.com/Base/Thingy/42|Some Thing>');
  assert.equal(tokens[0].url, null);
});
