import { moduleFor, test } from 'ember-qunit';
import { normalizeIsLocalized } from 'frontend-cp/serializers/locale';

moduleFor('serializer:locale', 'Unit | Serializer | locale');

test('normalizeIsLocalized', function(assert) {
  assert.deepEqual(
    normalizeIsLocalized({ is_localised: true }),
    { is_localized: true },
    'normalizes is_localised to is_localized'
  );

  assert.deepEqual(
    normalizeIsLocalized({ is_localised: true, is_localized: false }),
    { is_localized: false },
    'gives precedence to is_localized if present'
  );

  assert.deepEqual(
    normalizeIsLocalized({ is_localized: true }),
    { is_localized: true },
    'does nothing is is_localised is not present'
  );
});
