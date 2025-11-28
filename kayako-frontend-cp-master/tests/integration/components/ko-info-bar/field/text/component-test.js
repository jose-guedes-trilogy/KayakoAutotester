import { getOwner } from '@ember/application';
import { moduleForComponent, test } from 'frontend-cp/tests/helpers/qunit';
import hbs from 'htmlbars-inline-precompile';
const title = 'span:first';
const valueClass = 'input';
const textFieldValue = 'Some other value';

moduleForComponent('ko-info-bar/field/text', 'Integration | Component | ko info bar field text', {
  integration: true,
  beforeEach() {
    let intl = getOwner(this).lookup('service:intl');
    intl.setLocale('en-us');
    this.set('textFieldValue', textFieldValue);
  }
});

test('renders with title and value populated', function(assert) {
  assert.expect(2);
  this.onValueChange = function() {};
  this.render(hbs`
    {{ko-info-bar/field/text
      title='Some other field'
      value=textFieldValue
      onValueChange=onValueChange
    }}
  `);

  assert.equal(this.$(title).text(), 'Some other field');
  assert.equal(this.$(valueClass).val(), 'Some other value');
});

test('action is fired when input is changed', function(assert) {
  assert.expect(1);

  this.on('assertTextFieldValueChanged', value => assert.deepEqual(value, 'Khaleesi'));

  this.render(hbs`{{ko-info-bar/field/text
    title='Some other field'
    onValueChange=(action 'assertTextFieldValueChanged')
  }}`);

  let $inputField = this.$(valueClass);

  $inputField.val('Khaleesi');

  this.$('input').trigger(new $.Event('input'));
});
