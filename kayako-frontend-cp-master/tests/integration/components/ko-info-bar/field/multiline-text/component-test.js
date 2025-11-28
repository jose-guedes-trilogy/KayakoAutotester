import { run } from '@ember/runloop';
import { getOwner } from '@ember/application';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
let title = 'span:first';
let valueClass = 'textarea';

let textAreaFieldValue = 'Some other value';

moduleForComponent('ko-info-bar/field/multiline-text', 'Integration | Component | ko info bar field multiline text', {
  integration: true,
  beforeEach() {
    let intl = getOwner(this).lookup('service:intl');
    intl.setLocale('en-us');
    this.set('textAreaFieldValue', textAreaFieldValue);
  }
});

test('renders with title and value populated', function(assert) {
  assert.expect(2);
  this.onValueChange = function() {};
  this.render(hbs`{{ko-info-bar/field/multiline-text
    title='Some other field'
    value=textAreaFieldValue
    onValueChange=onValueChange
  }}`);

  assert.equal(this.$(title).text(), 'Some other field');
  assert.equal(this.$(valueClass).val(), 'Some other value');
});

test('action is fired on input', function(assert) {
  assert.expect(1);

  this.on('assertTextAreaFieldValueChanged', function(value) {
    assert.equal(value, 'Khaleesi');
  });

  this.render(hbs`{{ko-info-bar/field/multiline-text
    title='Some other field'
    onValueChange=(action 'assertTextAreaFieldValueChanged')
  }}`);

  let $textArea = this.$('textarea');

  $textArea.val('Khaleesi');

  run(() => {
    $textArea.trigger(new $.Event('input'));
  });
});
