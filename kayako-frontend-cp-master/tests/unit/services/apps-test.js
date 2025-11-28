import EmberObject from '@ember/object';
import { moduleFor, test } from 'ember-qunit';
import Service from '@ember/service';

moduleFor('service:apps', 'Unit | Service | apps', {
  integration: true,
  beforeEach() {
    this.register('service:launchDarkly', Service.extend({}));
  }
});

test('appsForSlot with no apps for the slot', function(assert) {
  const service = this.subject();
  const apps = service.appsForSlot('some-slot');
  assert.deepEqual(apps, [], 'slot with no apps returns empty array');
});

test('appsForSlot with one app for the slot', function(assert) {
  const service = this.subject();

  service.set('installedApps', [
    EmberObject.create({
      app: EmberObject.create({
        name: 'Case Sidebar App',
        slots: [
          EmberObject.create({
            location: 'case-sidebar'
          })
        ]
      })
    }),
    EmberObject.create({
      app: EmberObject.create({
        name: 'Other App',
        slots: [
          EmberObject.create({
            location: 'other-sidebar'
          })
        ]
      })
    })
  ]);

  const apps = service.appsForSlot('case-sidebar');
  assert.deepEqual(apps.mapBy('app.name'), ['Case Sidebar App'], 'returns the app for the slot');
});

test('appsForSlot with apps for multiple slots', function(assert) {
  const service = this.subject();

  service.set('installedApps', [
    EmberObject.create({
      app: EmberObject.create({
        name: 'Multi Slot App',
        slots: [
          EmberObject.create({
            location: 'case-sidebar'
          }),
          EmberObject.create({
            location: 'user-sidebar'
          })
        ]
      })
    })
  ]);

  const caseApps = service.appsForSlot('case-sidebar');
  const userApps = service.appsForSlot('user-sidebar');
  const otherApps = service.appsForSlot('other-sidebar');

  assert.deepEqual(caseApps.mapBy('app.name'), ['Multi Slot App'], 'appears in the case slot');
  assert.deepEqual(userApps.mapBy('app.name'), ['Multi Slot App'], 'appears in the user slot');
  assert.deepEqual(otherApps.mapBy('app.name'), [], 'does not appear in other slots');
});
