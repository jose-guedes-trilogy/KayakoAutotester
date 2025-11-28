import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('ko-avatar-update/trigger', 'Integration | Component | ko avatar update/trigger', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  // Template block usage:
  this.render(hbs`{{ko-avatar-update/trigger}}`);

  assert.equal(this.$('img').length, 2);
});
