import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('ko-organization-content/info-block', 'Integration | Component | ko organization content/info block', {
  integration: true
});

test('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{ko-organization-content/info-block}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#ko-organization-content/info-block hasOrg=true}}
      template block text
    {{/ko-organization-content/info-block}}
  `);

  assert.equal(this.$().text().trim(), 'template block text', 'renders what\'s inside');
  assert.equal(this.$('img').length, 1, 'has an avatar image');
});
