import { test } from 'qunit';
import moduleForAcceptance from 'frontend-cp/tests/helpers/module-for-acceptance';
import loginAsAdmin from 'frontend-cp/tests/helpers/login-as-admin';
import mockSearch from './helpers/mock-search';

const TITLE = '.qa-ko-admin_team__input-title';
const SEARCH = '.qa-ko-admin_team__agent-search';
const SEARCH_INPUT = `${SEARCH} input`;
const SUBMIT = '.qa-ko-admin_team__submit:first';

moduleForAcceptance('Acceptance | Admin | People | Teams', {
  beforeEach() {
    loginAsAdmin();
    mockSearch();
  }
});

test('Creating a team', function(assert) {
  let team;
  let alice = server.create('user', { full_name: 'Alice' });
  let bob = server.create('user', { full_name: 'Bob' });

  visit('/admin/team-settings/teams/new');
  fillIn(TITLE, 'Test Team');
  fillIn(SEARCH_INPUT, 'Alice');
  selectChoose(SEARCH, 'Alice');
  fillIn(SEARCH_INPUT, 'Bob');
  selectChoose(SEARCH, 'Bob');
  click(SUBMIT);

  andThen(() => {
    team = server.db.teams.where({ title: 'Test Team' })[0];
    alice = server.db.users.find(alice.id);
    bob = server.db.users.find(bob.id);

    assert.ok(team, 'persists the team');
    assert.equal(alice.teams.length, 1, 'associates Alice');
    assert.equal(bob.teams.length, 1, 'associates Bob');
  });
});
