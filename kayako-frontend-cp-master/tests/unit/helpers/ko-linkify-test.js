import { linkify } from 'frontend-cp/helpers/ko-linkify';
import { module, test } from 'qunit';

module('Unit | Helper | ko linkify');

test('URL in square brackets', function(assert) {
  assert.equal(
    linkify(['This is a link [http://example.com/]']).toHTML(),
    'This is a link [<a href="http://example.com/" target="_blank" rel="noreferrer noopener">http://example.com/</a>]'
  );
});

test('URL in square brackets with leading inner space', function(assert) {
  assert.equal(
    linkify(['This is a link [ http://example.com/]']).toHTML(),
    'This is a link [ <a href="http://example.com/" target="_blank" rel="noreferrer noopener">http://example.com/</a>]'
  );
});
