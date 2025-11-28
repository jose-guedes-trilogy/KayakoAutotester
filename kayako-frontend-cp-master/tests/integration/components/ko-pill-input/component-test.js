import { get } from '@ember/object';
import { moduleForComponent, test } from 'frontend-cp/tests/helpers/qunit';
import { triggerKeydown } from 'frontend-cp/tests/helpers/ember-power-select';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('ko-pill-input', 'Integration | Component | ko-pill-input', {
  integration: true
});

test('values displayed as pills', function(assert) {
  assert.expect(3);

  this.set('values', ['foo', 'bar'].map(value => ({ name: value })));

  this.render(hbs`
    {{ko-pill-input
      value=values
    }}
  `);

  assert.equal(this.$('.ember-power-select-multiple-option').length, 2, 'values displayed');
  assert.equal(this.$('.ember-power-select-multiple-option:eq(0) span').text(), 'foo');
  assert.equal(this.$('.ember-power-select-multiple-option:eq(1) span').text(), 'bar');
});

test('value is added', function(assert) {
  assert.expect(5);

  this.set('values', []);

  this.on('valueAdded', value => {
    assert.equal(get(value, 'name'), 'foo', 'value is correct');
    this.set('values', [value]);
  });

  this.render(hbs`
    {{ko-pill-input
      value=values
      onValueAddition=(action "valueAdded")
    }}
  `);

  assert.equal(this.$('.ember-power-select-multiple-option').length, 0, 'it is empty');

  let $inputField = this.$('.ember-power-select-trigger input');

  $inputField.val('foo');
  $inputField.trigger('input');

  assert.equal($inputField.val(), 'foo', 'value is in input');

  triggerKeydown($inputField[0], KeyCodes.enter);

  assert.equal($inputField.val(), '', 'value disappeared from input');

  assert.equal(this.$('.ember-power-select-multiple-option').length, 1, 'value added');
});

test('value is removed', function(assert) {
  assert.expect(3);

  this.set('values', ['bar'].map(value => ({ name: value })));

  this.on('valueRemoved', value => {
    assert.equal(get(value, 'name'), 'bar', 'value is correct');
    this.set('values', []);
  });

  this.render(hbs`
    {{ko-pill-input
      value=values
      onValueRemoval=(action "valueRemoved")
    }}
  `);

  assert.equal(this.$('.ember-power-select-multiple-option').length, 1, 'value is there');

  this.$('.ember-power-select-trigger .ember-power-select-multiple-remove-btn').click();

  assert.equal(this.$('.ember-power-select-multiple-option').length, 0, 'it is empty');
});
