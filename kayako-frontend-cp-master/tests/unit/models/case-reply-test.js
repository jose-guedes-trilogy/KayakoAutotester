import { moduleForModel, test } from 'ember-qunit';

const RFC4122 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

moduleForModel('case-reply', 'Unit | Model | case reply', {
  needs: [
    'model:account',
    'model:case',
    'model:case-form',
    'model:case-priority',
    'model:case-status',
    'model:case-type',
    'model:post',
    'model:team',
    'model:user'
  ]
});

test('clientId is generated automatically', function(assert) {
  let model = this.subject();
  let clientId = model.get('clientId');

  assert.ok(RFC4122.test(clientId),
    'automatically generates a valid UUID');
});
