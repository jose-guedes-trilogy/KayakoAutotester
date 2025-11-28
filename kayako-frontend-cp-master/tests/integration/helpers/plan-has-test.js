import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

const MockPlan = Service.extend({
  features: null,

  has(code) {
    let features = this.get('features') || [];
    return features.isAny('code', code);
  }
});

moduleForComponent('plan-has', 'helper:plan-has', {
  integration: true,

  beforeEach() {
    this.register('service:plan', MockPlan);
    this.inject.service('plan');
  }
});

test('it proxies plan.has and updates correctly', function(assert) {
  this.render(hbs`
    {{#if (plan-has "disco_mode")}}
      Let’s party!
    {{else}}
      Let’s stay home
    {{/if}}
  `);

  this.set('plan.features', []);

  assert.equal(this.$().text().trim(), 'Let’s stay home');

  this.set('plan.features', [{ code: 'disco_mode' }]);

  assert.equal(this.$().text().trim(), 'Let’s party!');
});
