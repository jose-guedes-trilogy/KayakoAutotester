import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import startMirage from 'frontend-cp/tests/helpers/setup-mirage-for-integration';

moduleForComponent('ko-instant-entity', 'Integration | Component | ko instant entity', {
  integration: true,
  beforeEach() {
    startMirage(this.container);
    let customerRole = server.create('role', { title: 'Agent', type: 'CUSTOMER', id: 4 });
    const locale = server.create('locale', { locale: 'en-us' });
    server.create('user', { fullName: 'User01', role: customerRole, locale: locale, time_zone: 'Europe/London'});
    server.create('user', { fullName: 'User02', role: customerRole, locale: locale, time_zone: 'Europe/London'});
    server.create('user', { fullName: 'User03', role: customerRole, locale: locale, time_zone: 'Europe/London'});
    server.create('organization', {name: 'Org01'});
    server.create('organization', {name: 'Org02'});
    server.create('organization', {name: 'Org03'});
  },
  afterEach() {
    window.server.shutdown();
  }
});

test('it renders users', function(assert) {
  server.get('/api/v1/search', (schema, req) => {
    assert.equal(req.queryParams.query, 'in:users User');

    let matches = schema.db.users.where(user => user.fullName.includes('User'));
    let results = matches.map(user => ({
      id: user.id,
      full_name: user.fullName,
      resource: 'user',
      resource_url: user.resource_url,
      data: user
    }));

    return {
      status: 200,
      resource: 'result',
      data: results
    };
  });

  this.render(hbs`{{ko-instant-entity}}`);
  this.$('.ko-instant-search--input-bar').val('User');
  this.$('.ko-instant-search--input-bar').trigger('input');
  return wait().then(() => assert.equal(this.$('.instant-entity-list-item').length, 3, 'Users rendered'));
});
