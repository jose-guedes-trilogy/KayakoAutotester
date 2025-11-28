import { getOwner } from '@ember/application';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('ko-info-bar', 'Integration | Component | ko info bar', {
  integration: true,
  beforeEach() {
    let intl = getOwner(this).lookup('service:intl');
    intl.setLocale('en-us');
  }
});

test('it renders', function(assert) {
  assert.expect(1);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{ko-info-bar}}`);

  assert.equal(this.$().text().trim(), '');
});
