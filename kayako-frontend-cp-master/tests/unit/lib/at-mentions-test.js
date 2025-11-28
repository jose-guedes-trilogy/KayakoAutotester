import { module, test } from 'qunit';

import { extractMentions, replaceMentionsWithPlainText, replaceMention } from 'frontend-cp/lib/at-mentions';

module('Unit | Lib | @mentions support');

test('#extractMentions - no valid mention data in html', function(assert) {
  assert.expect(1);

  let html = `
    <span data-mention-id="1" data-mention-type="user">@Foo Bar</span>
    <span data-mention-id="99" data-mention-type="user">@Baz Boo</span>
  `;

  let result = extractMentions(html);

  assert.deepEqual(result, []);
});

test('#extractMentions - extract mention data from html', function(assert) {
  assert.expect(1);

  let html = `
    <span id="foo" data-mention-id="1" data-mention-type="user" class="ko-mention">@Foo Bar</span>
    <span id="bar" data-mention-id="99" data-mention-type="user" class="ko-mention">@Baz Boo</span>
  `;

  let result = extractMentions(html);
  let expected = [
    { id: 'foo', subjectId: '1', type: 'user', text: '@Foo Bar' },
    { id: 'bar', subjectId: '99', type: 'user', text: '@Baz Boo' }
  ];

  assert.deepEqual(result, expected);
});

test('#extractMentions - extract mention data from html when mentioned multiple times', function(assert) {
  assert.expect(1);

  let html = `
    <span id="foo" data-mention-id="1" data-mention-type="user" class="ko-mention">@Foo Bar</span>
    <span id="bar" data-mention-id="99" data-mention-type="user" class="ko-mention">@Baz Boo</span>
    <span id="baz" data-mention-id="1" data-mention-type="user" class="ko-mention">@Foo Bar</span>
  `;

  let result = extractMentions(html);
  let expected = [
    { id: 'foo', subjectId: '1', type: 'user', text: '@Foo Bar' },
    { id: 'bar', subjectId: '99', type: 'user', text: '@Baz Boo' },
    { id: 'baz', subjectId: '1', type: 'user', text: '@Foo Bar' }
  ];

  assert.deepEqual(result, expected);
});

test('#extractMentions - extract mention data from html when contains different types', function(assert) {
  assert.expect(1);

  let html = `
    <span id="foo" data-mention-id="1" data-mention-type="user" class="ko-mention">@Foo Bar</span>
    <span id="bar" data-mention-id="99" data-mention-type="user" class="ko-mention">@Baz Boo</span>
    <span id="baz" data-mention-id="1" data-mention-type="team" class="ko-mention">@Team Barry</span>
  `;

  let result = extractMentions(html);
  let expected = [
    { id: 'foo', subjectId: '1', type: 'user', text: '@Foo Bar' },
    { id: 'bar', subjectId: '99', type: 'user', text: '@Baz Boo' },
    { id: 'baz', subjectId: '1', type: 'team', text: '@Team Barry' }
  ];

  assert.deepEqual(result, expected);
});

test('#extractMentions - incomplete mention data in html', function(assert) {
  assert.expect(1);

  let html = `
    <span id="foo" data-mention-id="1" data-mention-type="user" class="ko-mention">@Foo Bar</span>
    <span id="bar" data-mention-id="99" data-mention-type="user" class="ko-mention">@Baz Boo</span>
    <span id="baz" data-mention-id="2" class="ko-mention">@Cheese</span>
    <span id="boo" data-mention-type="user" class="ko-mention">@Bacon</span>
  `;

  let result = extractMentions(html);
  let expected = [
    { id: 'foo', subjectId: '1', type: 'user', text: '@Foo Bar' },
    { id: 'bar', subjectId: '99', type: 'user', text: '@Baz Boo' }
  ];

  assert.deepEqual(result, expected);
});

test('#replaceMentionsWithPlainText - strip all mentions from html', function(assert) {
  assert.expect(1);

  let html = `
    <span id="foo" data-mention-id="1" data-mention-type="user" class="ko-mention">@Foo Bar</span>
    <span id="bar" data-mention-id="99" data-mention-type="user" class="ko-mention">@Baz Boo</span>
  `;

  let result = replaceMentionsWithPlainText(html);
  let expected = `
    @Foo Bar
    @Baz Boo
  `;

  assert.equal(result, expected);
});

test('#replaceMentionsWithPlainText - strip nothing from html if no mentions exist', function(assert) {
  assert.expect(1);

  let html = 'Foo Bar';

  let result = replaceMentionsWithPlainText(html, [{ id: 'foo', subjectId: '99', type: 'user', text: 'Foo Bar' }]);
  let expected = 'Foo Bar';

  assert.equal(result, expected);
});

test('#replaceMention - replace mentions with html', function(assert) {
  assert.expect(1);

  let html = `
    <span id="111" data-mention-id="1" data-mention-type="user" class="ko-mention">@Foo Bar</span>
    <span id="222" data-mention-id="99" data-mention-type="user" class="ko-mentionr">@Baz Boo</span>
  `;

  let result = replaceMention(html, '222', '<h1>Hello</h1>');
  let expectedHtml = `
    <span id="111" data-mention-id="1" data-mention-type="user" class="ko-mention">@Foo Bar</span>
    <h1>Hello</h1>
  `;

  assert.equal(result, expectedHtml);
});

test('#replaceMention - replace mention with string', function(assert) {
  assert.expect(1);

  let html = `
    <span id="111" data-mention-id="1" data-mention-type="user" class="ko-mention">@Foo Bar</span>
    <span id="222" data-mention-id="99" data-mention-type="user" class="ko-mentionr">@Baz Boo</span>
  `;

  let result = replaceMention(html, '222', 'CHEESE');
  let expectedHtml = `
    <span id="111" data-mention-id="1" data-mention-type="user" class="ko-mention">@Foo Bar</span>
    CHEESE
  `;

  assert.equal(result, expectedHtml);
});
