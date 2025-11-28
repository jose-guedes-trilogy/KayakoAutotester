import { run } from '@ember/runloop';
import { getOwner } from '@ember/application';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import wait from 'ember-test-helpers/wait';
import {
  triggerKeydown,
  clickTrigger,
  nativeMouseUp
} from 'frontend-cp/tests/helpers/ember-power-select';
const trigger = '.ember-power-select-trigger';
const searchField = trigger + ' input:visible';
const optionList = '.ember-power-select-dropdown ul';
const optionListItem = optionList + ' li';
const firstOption = optionListItem + ':first-child';
const secondOption = optionListItem + ':nth-child(2)';
// const hierarchyList = 'ul:last li:visible';
// const hierarchyLevelOneItemOne = 'ul:last li:first:visible';
// const hierarchyLevelOneItemTwo = 'ul:last li:nth-of-type(2):visible';
// const hierarchyLevelTwoItemThree = 'ul:last li:nth-of-type(3):visible';

const defaultOptions = [
  { value: 'Team A', id: 1, children: [
    { id: 2, value: 'Jesse Bennett-Chamberlain' },
    { id: 3, value: 'Jamie Edwards' },
    { id: 4, value: 'Drew Warkentin' }
  ]},
  { value: 'Team B', children: [
    { id: 5, value: 'Jesse Bennett-Chamberlain' }
  ]},
  { id: 6, value: 'Team C' },
  { id: 7, value: 'Team D' }
];

moduleForComponent('ko-info-bar/field/drill-down', 'Integration | Component | ko-info-bar/field/drill-down', {
  integration: true,
  beforeEach() {
    let intl = getOwner(this).lookup('service:intl');
    intl.setLocale('en-us');
    this.registry.optionsForType('sanitizer', { instantiate: false });
    this.set('options', defaultOptions);
  }
});

test('levels are extracted from options', function(assert) {
  assert.expect(1);

  this.render(hbs`{{ko-info-bar/field/drill-down options=options renderInPlace=true}}`);
  clickTrigger();

  let expectedList = [
    '-',
    'Team A',
    'Team B',
    'Team C',
    'Team D'
  ];

  const actualList = this.$(optionListItem).map((i, el) => $(el).text().trim()).get();
  assert.deepEqual(actualList, expectedList, '1st level list');
});

test('suggestions are recalculated after search', function(assert) {
  assert.expect(1);

  this.render(hbs`{{ko-info-bar/field/drill-down options=options renderInPlace=true}}`);

  clickTrigger();

  run(() => {
    let input = this.$(searchField)[0];
    input.value = 'j';
    let event = new window.Event('input');
    input.dispatchEvent(event);
  });

  return wait().then(() => {
    let expectedList = [
      'Team A / Jesse Bennett-Chamberlain',
      'Team A / Jamie Edwards',
      'Team B / Jesse Bennett-Chamberlain'
    ];
    const actualList = this.$(optionListItem).map((i, el) => $(el).text().trim()).get();
    assert.deepEqual(actualList, expectedList, 'suggestions list');
  });
});

test('search input should be set to selected value', function(assert) {
  assert.expect(1);

  this.actions.valueChanged = value => {
    this.set('value', 5);
  };

  this.render(hbs`
    {{ko-info-bar/field/drill-down
      renderInPlace=true
      value=value
      options=options
      onValueChange=(action "valueChanged")
    }}
  `);

  clickTrigger();
  run(() => this.$(searchField).trigger(new $.Event('input', { target: { value: 'j' }})));

  return wait().then(() => {
    triggerKeydown(this.$(searchField)[0], KeyCodes.down);
    triggerKeydown(this.$(searchField)[0], KeyCodes.enter);

    assert.equal(this.$(searchField).val(), 'Team B / Jesse Bennett-Chamberlain', 'empty text');
  });
});


test('if a search is started but then all the characters are cleared from the search field the hierarchy dropdown should be shown', function(assert) {
  assert.expect(1);

  this.render(hbs`{{ko-info-bar/field/drill-down options=options renderInPlace=true}}`);

  clickTrigger();
  run(() => this.$(searchField).trigger(new $.Event('input', { target: { value: 'j' }})));
  run(() => this.$(searchField).trigger(new $.Event('input', { target: { value: '' }})));

  let expectedList = [
    '-',
    'Team A',
    'Team B',
    'Team C',
    'Team D'
  ];

  return wait().then(() => {
    const actualList = this.$(optionListItem).map((i, el) => $(el).text().trim()).get();
    assert.deepEqual(actualList, expectedList, '1st level list');
  });
});

test('moving up and down the hierarchy by mouse', function(assert) {
  assert.expect(2);

  this.render(hbs`{{ko-info-bar/field/drill-down options=options renderInPlace=true}}`);

  clickTrigger();
  nativeMouseUp(secondOption);

  let expectedListLevel1 = [
    'Back',
    'Team A',
    'Jesse Bennett-Chamberlain',
    'Jamie Edwards',
    'Drew Warkentin'
  ];

  const actualListLevel1 = this.$(optionListItem).map((i, el) => $(el).text().trim()).get();
  assert.deepEqual(actualListLevel1, expectedListLevel1, 'level 1 hierarchy list');
  nativeMouseUp(firstOption);

  let expectedRootLevelList = [
    '-',
    'Team A',
    'Team B',
    'Team C',
    'Team D'
  ];

  const actualRootLevelList = this.$(optionListItem).map((i, el) => $(el).text().trim()).get();
  assert.deepEqual(actualRootLevelList, expectedRootLevelList, 'root list');
});

test('moving up and down the hierarchy by mouse with full path on leaves', function(assert) {
  assert.expect(2);

  this.render(hbs`{{ko-info-bar/field/drill-down options=options showFullPathOnLeaves=true renderInPlace=true}}`);

  clickTrigger();
  nativeMouseUp(secondOption);

  let expectedListLevel1 = [
    'Back',
    'Team A',
    'Team A / Jesse Bennett-Chamberlain',
    'Team A / Jamie Edwards',
    'Team A / Drew Warkentin'
  ];

  const actualListLevel1 = this.$(optionListItem).map((i, el) => $(el).text().trim()).get();
  assert.deepEqual(actualListLevel1, expectedListLevel1, 'level 1 hierarchy list');
  nativeMouseUp(firstOption);

  let expectedRootLevelList = [
    '-',
    'Team A',
    'Team B',
    'Team C',
    'Team D'
  ];

  const actualRootLevelList = this.$(optionListItem).map((i, el) => $(el).text().trim()).get();
  assert.deepEqual(actualRootLevelList, expectedRootLevelList, 'root list');
});
