import EmberObject from '@ember/object';
import Service from '@ember/service';
import { moduleForComponent, test } from 'frontend-cp/tests/helpers/qunit';

let component, registry;

let virtualModelStub = Service.extend({
  makeSnapshot(theTrigger, schema) {
    return theTrigger;
  }
});

let theTrigger = { channel: 'TWITTER' };
let channels = [
  EmberObject.create({
    id: 'TWITTER',
    name: 'TWITTER',
    values: []
  }),
  EmberObject.create({
    id: 'MAIL',
    name: 'MAIL',
    values: []
  }),
  EmberObject.create({
    id: 'FACEBOOK',
    name: 'FACEBOOK',
    values: []
  }),
  EmberObject.create({
    id: 'SYSTEM',
    name: 'SYSTEM',
    values: []
  }),
  EmberObject.create({
    id: 'MESSENGER',
    name: 'MESSENGER',
    values: []
  }),
  EmberObject.create({
    id: 'API',
    name: 'API',
    values: []
  })
];
let definitions = [
  EmberObject.create({
    definitionType: 'STRING',
    group: 'CASES',
    inputType: 'STRING',
    label: 'Conversations Example',
    operators: [
      'string_contains',
      'string_does_not_contain'
    ],
    subType: '',
    values: ''
  }),
  EmberObject.create({
    definitionType: 'STRING',
    group: 'TWITTER',
    inputType: 'STRING',
    label: 'Twitter Example',
    operators: [
      'string_contains',
      'string_does_not_contain'
    ],
    subType: '',
    values: ''
  }),
  EmberObject.create({
    definitionType: 'STRING',
    group: 'MAIL',
    inputType: 'STRING',
    label: 'Mail Example',
    operators: [
      'string_contains',
      'string_does_not_contain'
    ],
    subType: '',
    values: ''
  }),
  EmberObject.create({
    definitionType: 'STRING',
    group: 'FACEBOOK',
    inputType: 'STRING',
    label: 'Facebook Example',
    operators: [
      'string_contains',
      'string_does_not_contain'
    ],
    subType: '',
    values: ''
  }),
  EmberObject.create({
    definitionType: 'STRING',
    group: 'SYSTEM',
    inputType: 'STRING',
    label: 'System Example',
    operators: [
      'string_contains',
      'string_does_not_contain'
    ],
    subType: '',
    values: ''
  }),
  EmberObject.create({
    definitionType: 'STRING',
    group: 'MESSENGER',
    inputType: 'STRING',
    label: 'Messenger Example',
    operators: [
      'string_contains',
      'string_does_not_contain'
    ],
    subType: '',
    values: ''
  }),
  EmberObject.create({
    definitionType: 'STRING',
    group: 'API',
    inputType: 'STRING',
    label: 'API Example',
    operators: [
      'string_contains',
      'string_does_not_contain'
    ],
    subType: '',
    values: ''
  })
];

moduleForComponent('ko-admin/triggers/form', 'Unit | Component | ko-admin/triggers/form', {
  unit: true,
  needs: [
    'service:confirmation'
  ],
  setup: function() {
    registry = this.registry || this.container;
    registry.register('service:virtual-model', virtualModelStub);
  }
});

test('selecting twitter as a channel does not allow MAIL, FACEBOOK, SYSTEM, MESSENGER, API defintions to be selected', function(assert) {
  assert.expect(7);

  component = this.subject({theTrigger: theTrigger, channels: channels, definitions: definitions});

  component.set('editedTrigger.channel', 'TWITTER');

  component.get('filteredDefinitions').forEach((definition) => {
    switch (definition.get('group')) {
      case 'CASES':
        return assert.notOk(definition.get('disabled'), 'cases enabled');
      case 'TWITTER':
        return assert.notOk(definition.get('disabled'), 'twitter enabled');
      case 'MAIL':
        return assert.ok(definition.get('disabled'), 'mail disabled');
      case 'FACEBOOK':
        return assert.ok(definition.get('disabled'), 'facebook disabled');
      case 'SYSTEM':
        return assert.ok(definition.get('disabled'), 'system disabled');
      case 'MESSENGER':
        return assert.ok(definition.get('disabled'), 'messenger disabled');
      case 'API':
        return assert.ok(definition.get('disabled'), 'api disabled');
    }
  });
});

test('selecting mail as a channel does not allow TWITTER, FACEBOOK, SYSTEM, MESSENGER, API defintions to be selected', function(assert) {
  assert.expect(7);

  component = this.subject({theTrigger: theTrigger, channels: channels, definitions: definitions});

  component.set('editedTrigger.channel', 'MAIL');

  component.get('filteredDefinitions').forEach((definition) => {
    switch (definition.get('group')) {
      case 'CASES':
        return assert.notOk(definition.get('disabled'), 'cases enabled');
      case 'TWITTER':
        return assert.ok(definition.get('disabled'), 'twitter enabled');
      case 'MAIL':
        return assert.notOk(definition.get('disabled'), 'mail disabled');
      case 'FACEBOOK':
        return assert.ok(definition.get('disabled'), 'facebook disabled');
      case 'SYSTEM':
        return assert.ok(definition.get('disabled'), 'system disabled');
      case 'MESSENGER':
        return assert.ok(definition.get('disabled'), 'messenger disabled');
      case 'API':
        return assert.ok(definition.get('disabled'), 'api disabled');
    }
  });
});

test('selecting facebook as a channel does not allow TWITTER, MAIL, SYSTEM, MESSENGER, API defintions to be selected', function(assert) {
  assert.expect(7);

  component = this.subject({theTrigger: theTrigger, channels: channels, definitions: definitions});

  component.set('editedTrigger.channel', 'FACEBOOK');

  component.get('filteredDefinitions').forEach((definition) => {
    switch (definition.get('group')) {
      case 'CASES':
        return assert.notOk(definition.get('disabled'), 'cases enabled');
      case 'TWITTER':
        return assert.ok(definition.get('disabled'), 'twitter enabled');
      case 'MAIL':
        return assert.ok(definition.get('disabled'), 'mail disabled');
      case 'FACEBOOK':
        return assert.notOk(definition.get('disabled'), 'facebook disabled');
      case 'SYSTEM':
        return assert.ok(definition.get('disabled'), 'system disabled');
      case 'MESSENGER':
        return assert.ok(definition.get('disabled'), 'messenger disabled');
      case 'API':
        return assert.ok(definition.get('disabled'), 'api disabled');
    }
  });
});

test('selecting system as a channel does not allow TWITTER, MAIL, FACEBOOK, MESSENGER, API defintions to be selected', function(assert) {
  assert.expect(7);

  component = this.subject({theTrigger: theTrigger, channels: channels, definitions: definitions});

  component.set('editedTrigger.channel', 'SYSTEM');

  component.get('filteredDefinitions').forEach((definition) => {
    switch (definition.get('group')) {
      case 'CASES':
        return assert.notOk(definition.get('disabled'), 'cases enabled');
      case 'TWITTER':
        return assert.ok(definition.get('disabled'), 'twitter enabled');
      case 'MAIL':
        return assert.ok(definition.get('disabled'), 'mail disabled');
      case 'FACEBOOK':
        return assert.ok(definition.get('disabled'), 'facebook disabled');
      case 'SYSTEM':
        return assert.notOk(definition.get('disabled'), 'system disabled');
      case 'MESSENGER':
        return assert.ok(definition.get('disabled'), 'messenger disabled');
      case 'API':
        return assert.ok(definition.get('disabled'), 'api disabled');
    }
  });
});

test('selecting messenger as a channel does not allow TWITTER, MAIL, FACEBOOK, SYSTEM, API defintions to be selected', function(assert) {
  assert.expect(7);

  component = this.subject({theTrigger: theTrigger, channels: channels, definitions: definitions});

  component.set('editedTrigger.channel', 'MESSENGER');

  component.get('filteredDefinitions').forEach((definition) => {
    switch (definition.get('group')) {
      case 'CASES':
        return assert.notOk(definition.get('disabled'), 'cases enabled');
      case 'TWITTER':
        return assert.ok(definition.get('disabled'), 'twitter enabled');
      case 'MAIL':
        return assert.ok(definition.get('disabled'), 'mail disabled');
      case 'FACEBOOK':
        return assert.ok(definition.get('disabled'), 'facebook disabled');
      case 'SYSTEM':
        return assert.ok(definition.get('disabled'), 'system disabled');
      case 'MESSENGER':
        return assert.notOk(definition.get('disabled'), 'messenger disabled');
      case 'API':
        return assert.ok(definition.get('disabled'), 'api disabled');
    }
  });
});

test('selecting api as a channel does not allow TWITTER, MAIL, FACEBOOK, SYSTEM, MESSENGER defintions to be selected', function(assert) {
  assert.expect(7);

  component = this.subject({theTrigger: theTrigger, channels: channels, definitions: definitions});

  component.set('editedTrigger.channel', 'API');

  component.get('filteredDefinitions').forEach((definition) => {
    switch (definition.get('group')) {
      case 'CASES':
        return assert.notOk(definition.get('disabled'), 'cases enabled');
      case 'TWITTER':
        return assert.ok(definition.get('disabled'), 'twitter enabled');
      case 'MAIL':
        return assert.ok(definition.get('disabled'), 'mail disabled');
      case 'FACEBOOK':
        return assert.ok(definition.get('disabled'), 'facebook disabled');
      case 'SYSTEM':
        return assert.ok(definition.get('disabled'), 'system disabled');
      case 'MESSENGER':
        return assert.ok(definition.get('disabled'), 'messenger disabled');
      case 'API':
        return assert.notOk(definition.get('disabled'), 'api disabled');
    }
  });
});
