import { moduleFor, test } from 'ember-qunit';
import { set } from '@ember/object';

moduleFor('service:locale', 'Unit | Service | locale', {
  integration: true
});

test('accountDefaultLocaleCode', function(assert) {
  let settings = [];
  let service = this.subject({ settings });

  assert.equal(
    service.get('accountDefaultLocaleCode'),
    'en-us',
    'expected to fall back to en-us'
  );

  settings.pushObject({
    key: 'account.default_language',
    value: 'es-es'
  });

  assert.equal(
    service.get('accountDefaultLocaleCode'),
    'es-es',
    'expected to recompute when the setting is present'
  );

  set(settings, 'firstObject.value', 'ca');

  assert.equal(
    service.get('accountDefaultLocaleCode'),
    'ca',
    'expected to recompute when the setting’s value changes'
  );
});
