import { moduleForComponent, test } from 'ember-qunit';
import Service from '@ember/service';
import EmberObject from '@ember/object';

const MockPermissions = Service.extend();
const MockSession = Service.extend();
const MockUser = EmberObject.extend();
const MockRole = EmberObject.extend();
const MockPermission = EmberObject.extend();

moduleForComponent('ko-user-content/action-menu', 'Unit | Component | ko-user-content/action-menu', {
  unit: true,

  beforeEach() {
    this.register('service:permissions', MockPermissions);
    this.register('service:session', MockSession);

    this.inject.service('session');
  }
});

test('canDeleteTargetUser', function(assert) {
  let customer = MockRole.create({ roleType: 'CUSTOMER' });
  let collaborator = MockRole.create({ roleType: 'COLLABORATOR' });
  let agent = MockRole.create({ roleType: 'AGENT' });
  let admin = MockRole.create({ roleType: 'ADMIN' });
  let owner = MockRole.create({ roleType: 'OWNER' });
  let user = MockUser.create({ role: null });
  let target = MockUser.create({ role: null });
  let grantUsersDelete = MockPermission.create({
    name: 'users.delete',
    value: true
  });
  let denyUsersDelete = MockPermission.create({
    name: 'users.delete',
    value: false
  });
  let component = this.subject({ user: target });

  this.session.set('user', user);

  // -- collaborator

  user.set('role', collaborator);

  target.set('role', customer);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'collaborator cannot delete customers');

  target.set('role', collaborator);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'collaborator cannot delete collaborators');

  target.set('role', agent);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'collaborator cannot delete agents');

  target.set('role', admin);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'collaborator cannot delete admins');

  target.set('role', owner);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'collaborator cannot delete owners');

  // -- agent

  user.set('role', agent);

  target.set('role', customer);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'agent cannot delete customers');

  target.set('role', customer);
  agent.set('permissions', [grantUsersDelete]);
  assert.equal(component.get('canDeleteTargetUser'), true,
    'agent can delete customers if users.delete granted');

  agent.set('permissions', [denyUsersDelete]);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'agent cannot delete customers if users.delete denied');

  agent.set('permissions', null); // reset role.permissions

  target.set('role', collaborator);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'agent cannot delete collaborators');

  target.set('role', agent);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'agent cannot delete agents');

  target.set('role', admin);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'agent cannot delete admins');

  target.set('role', owner);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'agent cannot delete owners');

  // -- admin

  user.set('role', admin);

  target.set('role', customer);
  assert.equal(component.get('canDeleteTargetUser'), true,
    'admin can delete customers');

  target.set('role', collaborator);
  assert.equal(component.get('canDeleteTargetUser'), true,
    'admin can delete collaborators');

  target.set('role', agent);
  assert.equal(component.get('canDeleteTargetUser'), true,
    'admin can delete agents');

  target.set('role', admin);
  assert.equal(component.get('canDeleteTargetUser'), true,
    'admin can delete admins');

  target.set('role', owner);
  assert.equal(component.get('canDeleteTargetUser'), false,
    'admin cannot delete owners');

  // -- owner

  user.set('role', owner);

  target.set('role', customer);
  assert.equal(component.get('canDeleteTargetUser'), true,
    'owner can delete customers');

  target.set('role', collaborator);
  assert.equal(component.get('canDeleteTargetUser'), true,
    'owner can delete collaborators');

  target.set('role', agent);
  assert.equal(component.get('canDeleteTargetUser'), true,
    'owner can delete agents');

  target.set('role', admin);
  assert.equal(component.get('canDeleteTargetUser'), true,
    'owner can delete admins');

  target.set('role', owner);
  assert.equal(component.get('canDeleteTargetUser'), true,
    'owner can delete owners');

  // -- invariant: no self-deletes

  component.set('user', user);

  assert.equal(component.get('canDeleteTargetUser'), false,
    'no user may delete themselves');
});
