import { app } from 'frontend-cp/tests/helpers/qunit';
import { test, skip } from 'qunit';

app('Acceptance | Agent | Welcome', {
  beforeEach() {
    const locale = server.create('locale');
    const roles = [
      server.create('role'),
      server.create('role', {title: 'Agent', type: 'AGENT', id: 2})
    ];
    const agentRole = roles[1];
    const agent = server.create('user', { role: agentRole, locale: locale, time_zone: 'Europe/London' });
    const session = server.create('session', { user: agent });
    server.create('plan', { limits: { agents: 20 }, features: [], account_id: '123', subscription_id: '123' });
    const brand = server.create('brand');
    server.create('template', { brand, name: 'helpcenter_kayako_messenger', contents: 'dummy' });

    server.create('setting', {
      name: 'account_connected',
      value: '0'
    });

    server.create('setting', {
      name: 'account_setup',
      value: '0'
    });

    server.create('setting', {
      name: 'agent_added',
      value: '0'
    });

    server.create('setting', {
      name: 'setup',
      value: '0'
    });

    login(session.id);
  },

  afterEach() {
    logout();
  }
});

test('visit /agent/welcome', function(assert) {
  visit('/agent/welcome');
  andThen(function() {
    assert.equal(currentURL(), '/agent/welcome');
  });
});

test('open email setup modal', function(assert) {
  visit('/agent/welcome');
  andThen(function() {
    click('.card--email');
  });

  andThen(() => {
    assert.equal(find('.email-setup-prompt').length, 1);
  });
});

test('show connect email form when clicking connect button', function(assert) {
  visit('/agent/welcome');
  andThen(() => {
    click('.card--email');
    click('.action-connect-email');
  });

  andThen(() => {
    assert.equal(find('.email-setup-connect').length, 1);
  });
});

test('go back to email setup prompt', function(assert) {
  visit('/agent/welcome');
  andThen(() => {
    click('.card--email');
    click('.action-connect-email');
    click('.goto-email-prompt');
  });

  andThen(() => {
    assert.equal(find('.email-setup-prompt').length, 1);
  });
});

test('connect existing email', function(assert) {
  visit('/agent/welcome');
  andThen(() => {
    click('.card--email');
    click('.action-connect-email');
    fillIn('.existing-email', 'someone@kayako.com');
    click('.server-connect-email');
  });

  andThen(() => {
    assert.equal(find('.email-setup-postconnect').length, 1);
    assert.equal(server.db.mailboxes.get('lastObject.address'), 'someone@kayako.com');
  });
});

test('show create email form when clicking create button', function(assert) {
  visit('/agent/welcome');
  andThen(() => {
    click('.card--email');
    click('.action-create-email');
  });

  andThen(() => {
    assert.equal(find('.email-setup-create').length, 1);
  });
});

test('open social modal', function(assert) {
  visit('/agent/welcome');
  andThen(() => {
    click('.card--social');
  });

  andThen(() => {
    assert.equal(find('.social-setup-prompt').length, 1);
  });
});

test('select to connect social accounts', function(assert) {
  visit('/agent/welcome');
  andThen(() => {
    click('.card--social');
    click('.select-social-connect');
  });

  andThen(() => {
    assert.equal(find('.social-setup-connect').length, 1);
  });
});

test('skip social connection modal', function(assert) {
  visit('/agent/welcome');
  andThen(() => {
    click('.card--social');
    click('.skip-social-connect');
  });

  andThen(() => {
    assert.equal(find('.social-setup-prompt').length, 0);
  });
});

test('open messenger modal', function(assert) {
  visit('/agent/welcome');
  andThen(() => {
    click('.card--messenger');
  });

  andThen(() => {
    assert.equal(find('.messenger-setup-intro').length, 1);
  });
});

test('messenger setup do later', function(assert) {
  visit('/agent/welcome');
  andThen(() => {
    click('.card--messenger');
    click('.messenger-next-button');
    click('.messenger-later-button');
  });

  andThen(() => {
    assert.equal(find('.agent-setup-prompt').length, 1);
  });
});

test('open add agents modal', function(assert) {
  visit('/agent/welcome');
  andThen(() => {
    click('.card--agents');
  });

  andThen(() => {
    assert.equal(find('.agent-setup-prompt').length, 1);
  });
});

skip('add team', function(assert) {
  withVariation('release-new-onboarding', true);

  visit('/agent/welcome');
  andThen(() => {
    click('.card--team');
  });

  andThen(() => {
    assert.equal(find('.team-setup-prompt').length, 1);
  });

  andThen(() => {
    click('.goto-add-team');
  }); 

  andThen(() => {
    assert.equal(find('.add-team-section').length, 1);
  });
});

test('show add agents section', function(assert) {
  visit('/agent/welcome');
  andThen(() => {
    click('.card--agents');
    click('.goto-add-agents');
  });

  andThen(() => {
    assert.equal(find('.add-agents-section').length, 1);
  });
});

skip('start conversations modal', function(assert) {
  withVariation('release-new-onboarding', true);

  visit('/agent/welcome');
  andThen(() => {
    click('.card--conversations');
  });

  andThen(() => {
    assert.equal(find('.conversations-prompt').length, 1);
  });
});
