import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import startMirage from 'frontend-cp/tests/helpers/setup-mirage-for-integration';

let members;

moduleForComponent('ko-member-list', 'integration | Component | ko member list', {
  integration: true,
  beforeEach() {
    startMirage(this.container);
    members = server.createList('user', 10);
  },
  afterEach() {
    window.server.shutdown();
  }
});

test('it renders as many elements as members', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.set('members', members);

  // Template block usage:
  this.render(hbs`
    {{#ko-member-list hasOrg=true members=members}}
    {{/ko-member-list}}
  `);

  assert.equal(this.$('.avatar-container').length, 10);
});
