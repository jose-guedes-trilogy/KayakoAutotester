import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { getOwner } from '@ember/application';

moduleForComponent('ko-avatar-update/header', 'Integration | Component | ko avatar update/header', {
  integration: true,
  setup() {
    const intl = getOwner(this).lookup('service:intl');
    intl.setLocale('en-us');
    intl.addTranslations('en-us', {
      generic: {
        uploads: {
          avatar_validation: 'Avatar validation'
        }
      }
    });
  }
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  // Template block usage:
  this.render(hbs`{{ko-avatar-update/header}}`);

  assert.equal(this.$().text().trim(), 'Avatar validation');  // Locale string key name expected
});
