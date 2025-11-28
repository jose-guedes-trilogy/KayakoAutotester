import { test } from 'qunit';
import moduleForAcceptance from 'frontend-cp/tests/helpers/module-for-acceptance';
import createSubscription from 'frontend-cp/mirage/scenarios/subscription';
import { createAdmin } from 'frontend-cp/mirage/scenarios/users';
import { createInbox } from 'frontend-cp/mirage/scenarios/views';
import { createCase } from 'frontend-cp/mirage/scenarios/cases';

moduleForAcceptance('Acceptance | redirects', {
  beforeEach() {
    createSubscription(server);
    createInbox(server);

    let user = createAdmin(server);
    let session = server.create('session', { user });

    server.create('setting', {
      category: 'account',
      name: 'default_language',
      value: 'en-us'
    });

    login(session.id);
  }
});

test('/agent/cases → /agent/conversations', async function(assert) {
  await visit('/agent/cases');
  assert.equal(currentURL(), '/agent/conversations/view/1');
});

test('/agent/cases/view/1 → /agent/conversations/view/1', async function(assert) {
  await visit('/agent/cases/view/1');
  assert.equal(currentURL(), '/agent/conversations/view/1');
});

test('/agent/cases/:id → /agent/conversations/:id', async function(assert) {
  let { id } = createCase(server);

  await visit(`/agent/cases/${id}`);
  assert.equal(currentURL(), `/agent/conversations/${id}`);
});

test('/agent/cases/:id/user → /agent/conversations/:id/user', async function(assert) {
  let { id } = createCase(server);

  await visit(`/agent/cases/${id}/user`);
  assert.equal(currentURL(), `/agent/conversations/${id}/user`);
});

test('/agent/cases/new/2017-01-01-00-00-00 → /agent/conversations/new/2017-01-01-00-00-00', async function(assert) {
  await visit('/agent/cases/new/2017-01-01-00-00-00');
  assert.equal(currentURL(), '/agent/conversations/new/2017-01-01-00-00-00');
});

test('/admin/manage/case-fields → /admin/customizations/conversation-fields', async function(assert) {
  await visit('/admin/customizations/conversation-fields');
  assert.equal(currentURL(), '/admin/customizations/conversation-fields');
});

test('/admin/manage/case-fields/123 → /admin/customizations/conversation-fields/123', async function(assert) {
  let { id } = server.create('case-field');

  await visit(`/admin/manage/case-fields/${id}`);
  assert.equal(currentURL(), `/admin/manage/conversation-fields/${id}`);
});

test('/admin/manage/case-fields/select-type → /admin/customizations/conversation-fields/select-type', async function(assert) {
  await visit('/admin/manage/case-fields/select-type');
  assert.equal(currentURL(), '/admin/manage/conversation-fields/select-type');
});

test('/admin/manage/case-forms → /admin/conversations/forms', async function(assert) {
  await visit('/admin/manage/case-forms');
  assert.equal(currentURL(), '/admin/manage/conversation-forms');
});

test('/admin/manage/case-forms/123 → /admin/conversations/forms/123', async function(assert) {
  let { id } = server.create('case-form');

  await visit(`/admin/manage/case-forms/${id}`);
  assert.equal(currentURL(), `/admin/manage/conversation-forms/${id}`);
});

test('/admin/manage/case-forms/new → /admin/conversations/forms/new', async function(assert) {
  await visit('/admin/conversations/forms/new');
  assert.equal(currentURL(), '/admin/conversations/forms/new');
});

test('/agent/login?redirectTo=/agent/cases/:id → /agent/login', async function(assert) {
  logout();

  await visit('/agent/login?redirectTo=/agent/cases/123');

  assert.equal(currentURL(), '/agent/login');
});
