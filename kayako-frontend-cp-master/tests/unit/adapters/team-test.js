import { moduleFor, test } from 'ember-qunit';

moduleFor('adapter:team', 'Unit | Adapter | team', {
  integration: true
});

test('addMembers', function(assert) {
  let team = { id: 'team-1' };
  let members = [{ id: 'member-1' }, { id: 'member-2' }];
  let adapter = this.subject();
  let requested = {};

  adapter.ajax = (url, method, options) => {
    requested.url = url;
    requested.method = method;
    requested.options = options;
  };

  adapter.addMembers(team, members);

  assert.equal(requested.method, 'POST');
  assert.equal(requested.url, '/api/v1/teams/team-1/members');
  assert.deepEqual(requested.options, { data: { agent_ids: 'member-1,member-2' } });
});

test('removeMembers', function(assert) {
  let team = { id: 'team-1' };
  let members = [{ id: 'member-1' }, { id: 'member-2' }];
  let adapter = this.subject();
  let requested = {};

  adapter.ajax = (url, method) => {
    requested.url = url;
    requested.method = method;
  };

  adapter.removeMembers(team, members);

  assert.equal(requested.method, 'DELETE');
  assert.equal(requested.url, '/api/v1/teams/team-1/members?agent_ids=member-1,member-2');
});
