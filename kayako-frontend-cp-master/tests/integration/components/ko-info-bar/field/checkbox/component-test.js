import { run } from '@ember/runloop';
import {
  moduleForComponent,
  test
} from 'frontend-cp/tests/helpers/qunit';
import hbs from 'htmlbars-inline-precompile';

import checkboxStyles from 'frontend-cp/components/ko-info-bar/field/checkbox/styles';

moduleForComponent('ko-info-bar/field/checkbox', {
  integration: true
});


let options = [
    { id: 1, value: 'Red' },
    { id: 2, value: 'Green' },
    { id: 3, value: 'Blue' }
];

test('it has a title', function (assert) {
  assert.expect(2);

  this.set('title', '');

  this.render(hbs`
    {{ko-info-bar/field/checkbox
      title=title
    }}
  `);

  assert.equal($.trim(this.$().text()), '');

  let title = 'Title Goes Here';
  run(() => {
    this.set('title', title);
  });

  assert.equal($.trim(this.$(`.${checkboxStyles.header}`).text()), title);
});

test('it has checkboxes', function (assert) {
  assert.expect(3);

  this.set('options', options);
  this.render(hbs`
    {{ko-info-bar/field/checkbox
      options=options
    }}
  `);

  assert.equal($.trim(this.$('label:eq(0)').text().trim()), options[0].value);
  assert.equal($.trim(this.$('label:eq(1)').text().trim()), options[1].value);
  assert.equal($.trim(this.$('label:eq(2)').text().trim()), options[2].value);
});

test('checkbox state is in sync with the data', function (assert) {
  assert.expect(4);

  this.set('options', options);
  this.set('value', '2');
  this.set('actions.checked', (value) => {
    assert.deepEqual(value, '2,1', 'it has been checked');
  });

  this.render(hbs`
    {{ko-info-bar/field/checkbox
      options=options
      value=value
      onValueChange=(action "checked")
    }}
  `);

  assert.equal(this.$('[aria-checked]:eq(0)').attr('aria-checked'), 'false');
  assert.equal(this.$('[aria-checked]:eq(1)').attr('aria-checked'), 'true');
  assert.equal(this.$('[aria-checked]:eq(2)').attr('aria-checked'), 'false');

  run(() => {
    this.$('[aria-checked]:eq(0)').click();
  });
});
