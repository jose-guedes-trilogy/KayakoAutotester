import { moduleForComponent, test } from 'ember-qunit';
import EmberObject from '@ember/object';
import { generateAssigneeValues } from 'frontend-cp/components/ko-case-content/field/assignee/component';

const emberObjects = (...objects) => objects.map(o => EmberObject.create(o));

moduleForComponent('ko-case-content/field/assignee', 'Unit | Component | ko case content/field/assignee', {
  integration: true
});

test('assigneeValues only contains enabled agents ', function(assert) {
  let teams = emberObjects({
    id: 'support',
    title: 'Support'
  });
  let agents = emberObjects({
    id: 'alice',
    fullName: 'Alice',
    isEnabled: true,
    teams
  }, {
    id: 'bob',
    fullName: 'Bob',
    isEnabled: false,
    teams
  });
  let actual = generateAssigneeValues({ teams, agents });

  let actualIDs = actual.map(item => [item.id, item.children.map(child => child.id)]);
  let expectedIDs = [['support', ['support-alice']]];

  assert.deepEqual(actualIDs, expectedIDs);
});
