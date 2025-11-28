import { run } from '@ember/runloop';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

import styles from 'frontend-cp/components/ko-editable-text/styles';

moduleForComponent('ko-editable-text', 'Integration | Component | ko-editable-text', {
  integration: true
});

test('is not editing by default', function(assert) {
  this.render(hbs`
    {{ko-editable-text
      isEdited=false
      isErrored=false
      isDisabled=false
      value="test"}}
  `);

  assert.ok(
    this.$().find(`.${styles.text}`).length,
    'text element should be visible'
  );

  assert.ok(
    !this.$().find(`.${styles.input}`).length,
    'input field element should be hidden'
  );
});

test('when clicked/on focus it becomes editable', function(assert) {
  this.render(hbs`
    {{ko-editable-text
      isEdited=false
      isErrored=false
      isDisabled=false
      value="test"}}
  `);

  run(() => {
    this.$().find(`.${styles.text}`).click();
  });

  assert.ok(
    !this.$().find(`.${styles.text}`).length,
    'text element should be hidden'
  );

  assert.ok(
    this.$().find(`.${styles.input}`).length,
    'input field element should be visible'
  );
});

test('when focused out it becomes not editable', function(assert) {
  this.render(hbs`
    {{ko-editable-text
      isEdited=false
      isErrored=false
      isDisabled=false
      value="test"}}
  `);

  run(() => {
    this.$().find(`.${styles.input}`).trigger('focusout');
  });

  assert.ok(
    this.$().find(`.${styles.text}`).length,
    'text element should be visible'
  );

  assert.ok(
    !this.$().find(`.${styles.input}`).length,
    'input field element should be hidden'
  );
});
