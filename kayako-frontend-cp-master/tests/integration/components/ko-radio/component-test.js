import { run } from '@ember/runloop';
import { moduleForComponent, test } from 'frontend-cp/tests/helpers/qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('ko-radio', {
  integration: true
});

test('can be selected by clicking on radio', function(assert) {
  assert.expect(1);

  this.set('checked', true);
  this.set('onChange', (value) => {
    assert.equal(value, true, 'it has been selected');
  });
  this.render(hbs`
    {{ko-radio
      checked=checked
      onChange=onChange
    }}
  `);

  run(() => {
    this.$('div:first').click();
  });
});

test('when disabled radio can\'t be selected', function(assert) {
  assert.expect(0);

  this.set('checked', true);
  this.set('onChange', (value) => {
    assert.equal(true, false, 'radio can\'t be selected when disabled');
  });
  this.render(hbs`
    {{ko-radio
      checked=checked
      onChange=onChange
      disabled=true
    }}
  `);

  run(() => {
    this.$('div:first').click();
  });
});
