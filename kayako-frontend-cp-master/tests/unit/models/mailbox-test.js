import { moduleForModel, test } from 'ember-qunit';
import { run } from '@ember/runloop';

moduleForModel('mailbox', 'Unit | Model | mailbox', {
  needs: ['model:brand', 'model:contact']
});

test('isCustomDomain', function(assert) {
  let mailbox = this.subject();

  run(() => {
    mailbox.set('address', 'support@test.kayako.com');
    assert.equal(mailbox.get('isCustomDomain'), false);

    mailbox.set('address', 'custom@test.kayako.com');
    assert.equal(mailbox.get('isCustomDomain'), false);

    mailbox.set('address', 'support@example.com');
    assert.equal(mailbox.get('isCustomDomain'), true);
  });
});
