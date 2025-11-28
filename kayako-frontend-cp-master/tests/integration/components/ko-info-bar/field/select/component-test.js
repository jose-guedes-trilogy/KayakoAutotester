import { getOwner } from '@ember/application';
import { moduleForComponent, test } from 'frontend-cp/tests/helpers/qunit';
import hbs from 'htmlbars-inline-precompile';
import { nativeMouseUp, clickTrigger } from 'frontend-cp/tests/helpers/ember-power-select';

moduleForComponent('ko-info-bar/field/select', 'Integration | Component | ko-info-bar/field/select', {
  integration: true,
  beforeEach() {
    let intl = getOwner(this).lookup('service:intl');
    intl.setLocale('en-us');
    this.registry.optionsForType('sanitizer', { instantiate: false });
  }
});

const dummyContent = [
  'Open',
  'Pending',
  'Closed'
];

test('content appears in the dropdown', function(assert) {
  assert.expect(1);
  this.options = dummyContent;

  this.render(hbs`
    {{ko-info-bar/field/select
      options=options
    }}
  `);

  clickTrigger();
  assert.equal($('.ember-power-select-dropdown').text().replace(/(\r\n|\n|\r| )/g, ''), '-OpenPendingClosed');
});

test('clicking on a content item triggers value change', function(assert) {
  assert.expect(1);

  this.set('options', dummyContent);

  this.change = (value) => {
    assert.equal(value, 'Open');
  };

  this.render(hbs`
    {{ko-info-bar/field/select
      options=options
      onValueChange=change
    }}
  `);

  clickTrigger();
  nativeMouseUp('.ember-power-select-option:nth-child(2)');
});
