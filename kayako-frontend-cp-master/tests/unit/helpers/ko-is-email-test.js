import { koIsEmail } from 'frontend-cp/helpers/ko-is-email';
import { module, test } from 'qunit';

module('Unit | Helper | ko is email');

// Replace this with your real tests.
test('it works', function (assert) {
  let result = koIsEmail('ab@cd.co');
  assert.ok(result);

  assert.equal(koIsEmail('ab@cd.co'), true);
  assert.equal(koIsEmail('ab@cd'), false);
  assert.equal(koIsEmail('1234'), false);
  assert.equal(koIsEmail('john.doe+test@kayako.com'), true);
});

