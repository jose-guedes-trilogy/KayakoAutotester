import { run } from '@ember/runloop';
import { moduleForComponent, test } from 'frontend-cp/tests/helpers/qunit';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

let component;

moduleForComponent('ko-toggle', 'Unit | Component | ko-toggle', {
  needs: [
    'helper:qa-cls',
    'helper:local-class'
  ],
  unit: true,
  setup: function() {
    component = this.subject();
    component.set('label', 'Nuclear bomb switch');
    component.set('tabindex', 0);
  },
  teardown: function() {

  }
});

test('can be activated by pressing spacebar', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.send('keyUp', { keyCode: KeyCodes.space });
  });

  assert.equal(component.activated, true, 'it has been activated');
});

test('can be activated by pressing spacebar (DDAU)', function(assert) {
  assert.expect(1);

  this.render();

  component.set('onToggle', 'activated');
  component.set('targetObject', {
    activated(value) {
      assert.equal(value, true, 'it has been activated');
    }
  });

  run(() => {
    component.send('keyUp', { keyCode: KeyCodes.space });
  });
});

test('can be deactivated by pressing spacebar', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.set('activated', true);
  });

  run(() => {
    component.send('keyUp', { keyCode: KeyCodes.space });
  });

  assert.equal(component.activated, false, 'it has been deactivated');
});

test('can be deactivated by pressing spacebar (DDAU)', function(assert) {
  assert.expect(1);

  this.render();

  run(() => {
    component.set('activated', true);
  });

  component.set('onToggle', 'activated');
  component.set('targetObject', {
    activated(value) {
      assert.equal(value, false, 'it has been deactivated');
    }
  });

  run(() => {
    component.send('keyUp', { keyCode: KeyCodes.space });
  });
});
