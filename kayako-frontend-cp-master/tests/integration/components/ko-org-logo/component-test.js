import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

moduleForComponent('ko-org-logo', 'Integration | Component | ko org logo', {
  integration: true
});

test('Loads logo of a domain.', function(assert) {
  this.render(hbs`{{ko-org-logo domain='spotify.com'}}`);
  assert.ok(this.$('img').attr('src').includes('spotify.com'));
});

test('Height is as expected', function(assert) {
  this.render(hbs`{{ko-org-logo domain='spotify.com' size=30}}`);
  assert.equal(this.$('img').attr('height'), 30);
});

test('Default values work', function(assert) {
  this.render(hbs`{{ko-org-logo}}`);
  this.$('img').trigger('onerror');
  return wait().then(() => {
    assert.equal(this.$('img').attr('height'), 42);
    assert.equal(this.$('img').attr('width'), 42);
    assert.equal(this.$('img').attr('src'), '/images/inline-icons/icon--org--32.svg');
  });
});
