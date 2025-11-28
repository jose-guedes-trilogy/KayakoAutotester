import { run } from '@ember/runloop';
import { moduleForComponent, test } from 'frontend-cp/tests/helpers/qunit';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

let component;

moduleForComponent('ko-checkbox', 'Unit | Component | ko-checkbox', {
  unit: true,
  setup: function() {
    component = this.subject();
    component.set('label', 'Remember my preferences');
    component.set('tabindex', 0);
  },
  teardown: function() {
  },
  needs: [
    'helper:qa-cls',
    'helper:local-class'
  ]
});

test('can be checked by pressing spacebar', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.send('keyUp', { keyCode: KeyCodes.space });
  });

  assert.equal(component.checked, true, 'it has been checked');
});

test('can be checked by pressing spacebar (DDAU)', function(assert) {
  assert.expect(1);

  this.render();

  component.set('onCheck', 'checked');
  component.set('targetObject', {
    checked(value) {
      assert.equal(value, true, 'it has been checked');
    }
  });

  run(() => {
    component.send('keyUp', { keyCode: KeyCodes.space });
  });
});

test('can be unchecked by pressing spacebar', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.set('checked', true);
  });

  run(() => {
    component.send('keyUp', { keyCode: KeyCodes.space });
  });

  assert.equal(component.checked, false, 'it has been unchecked');
});

test('can be unchecked by pressing spacebar (DDAU)', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.set('checked', true);
  });

  component.set('onCheck', 'checked');
  component.set('targetObject', {
    checked(value) {
      assert.equal(value, false, 'it has been unchecked');
    }
  });

  run(() => {
    component.send('keyUp', { keyCode: KeyCodes.space });
  });
});

test('can be checked by clicking on checkbox', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.send('toggleCheckbox');
  });

  assert.equal(component.checked, true, 'it has been checked');
});

test('can be checked by clicking on checkbox (DDAU)', function(assert) {
  assert.expect(1);

  this.render();

  component.set('onCheck', 'checked');
  component.set('targetObject', {
    checked(value) {
      assert.equal(value, true, 'it has been checked');
    }
  });

  run(() => {
    component.send('toggleCheckbox');
  });
});

test('can be unchecked by clicking on checkbox', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.set('checked', true);
  });

  run(() => {
    component.send('toggleCheckbox');
  });

  assert.equal(component.checked, false, 'it has been unchecked');
});

test('can be unchecked by clicking on checkbox (DDAU)', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.set('checked', true);
  });

  component.set('onCheck', 'checked');
  component.set('targetObject', {
    checked(value) {
      assert.equal(value, false, 'it has been unchecked');
    }
  });

  run(() => {
    component.send('toggleCheckbox');
  });
});

test('can be checked by clicking on label', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.send('toggleCheckbox');
  });

  assert.equal(component.checked, true, 'it has been checked');
});

test('can be checked by clicking on label (DDAU)', function(assert) {
  assert.expect(1);

  this.render();

  component.set('onCheck', 'checked');
  component.set('targetObject', {
    checked(value) {
      assert.equal(value, true, 'it has been checked');
    }
  });

  run(() => {
    component.send('toggleCheckbox');
  });
});

test('can be unchecked by clicking on label', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.set('checked', true);
  });

  run(() => {
    component.send('toggleCheckbox');
  });

  assert.equal(component.checked, false, 'it has been unchecked');
});

test('can be unchecked by clicking on label (DDAU)', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.set('checked', true);
  });

  component.set('onCheck', 'checked');
  component.set('targetObject', {
    checked(value) {
      assert.equal(value, false, 'it has been unchecked');
    }
  });

  run(() => {
    component.send('toggleCheckbox');
  });
});

test('when disabled checkbox can\'t be checked', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.set('disabled', true);
  });

  run(() => {
    component.send('toggleCheckbox');
  });

  assert.equal(component.checked, false, 'it can\'t be checked');
});

// TODO: make this tests to be as Integration
//test('when disabled checkbox can\'t be checked (DDAU)', function(assert) {
//  assert.expect(0);
//
//  this.render();
//
//  Ember.run(() => {
//    component.set('disabled', true);
//  });
//
//  component.set('onCheck', 'checked');
//  component.set('targetObject', {
//    checked() {
//      assert.equal(true, false, 'it can\'t be checked');
//    }
//  });
//
//  Ember.run(() => {
//    this.$(checkbox).click();
//  });
//});
