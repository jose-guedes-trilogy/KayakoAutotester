import { test } from 'qunit';
import moduleForAcceptance from 'frontend-cp/tests/helpers/module-for-acceptance';
import loginAsAdmin from 'frontend-cp/tests/helpers/login-as-admin';
import mockSearch from './helpers/mock-search';

const TITLE = '.qa-ko-admin_team__input-title';
const SEARCH = '.qa-ko-admin_team__agent-search';
const SEARCH_INPUT = `${SEARCH} input`;
const SUBMIT = '.qa-ko-admin_team__submit:first';
const REMOVE_MEMBER = '.qa-ko-admin_team__remove-member';

moduleForAcceptance('Acceptance | Admin | People | Teams', {
  beforeEach() {
    loginAsAdmin();
    mockSearch();
  }
});

test('Editing a team', function(assert) {
  let team = server.create('team', { title: 'Test Team', member_count: 1 });
  let role = server.create('role', { title: 'Agent', roleType: 'AGENT' });
  let alice = server.create('user', {
    full_name: 'Alice',
    role,
    teams: [{ id: team.id, resource_type: 'team' }]
  });
  let bob = server.create('user', {
    full_name: 'Bob',
    role
  });

  visit(`/admin/team-settings/teams/${team.id}`);
  fillIn(TITLE, 'Edited Team');
  click(`${REMOVE_MEMBER}:first`);
  fillIn(SEARCH_INPUT, 'Bob');
  selectChoose(SEARCH, 'Bob');
  click(SUBMIT);

  andThen(() => {
    team = server.db.teams.find(team.id);
    alice = server.db.users.find(alice.id);
    bob = server.db.users.find(bob.id);

    assert.equal(team.title, 'Edited Team', 'persists the new title');
    assert.equal(bob.teams.length, 1, 'associates new members');
    assert.equal(alice.teams.length, 0, 'disassociates ex-members');
  });
});
