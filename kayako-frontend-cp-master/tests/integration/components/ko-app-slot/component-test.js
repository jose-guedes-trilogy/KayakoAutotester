import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';

moduleForComponent('ko-app-slot', 'Integration | Component | ko-app-slot', {
  integration: true,
  beforeEach() {
    this.register('service:launchDarkly', Service.extend({}));
    this.inject.service('apps', { as: 'appsService' });
  }
});

test('with no apps for the slot', function(assert) {
  this.get('appsService').set('installedApps', []);

  this.render(hbs`
    {{ko-app-slot
      name="case-sidebar"
    }}
  `);

  assert.equal(this.$('.app').length, 0, 'renders no apps');
});

test('with apps for the slot', function(assert) {
  this.get('appsService').set('installedApps', [
    EmberObject.create({
      app: EmberObject.create({
        slots: [
          EmberObject.create({
            location: 'case-sidebar'
          })
        ]
      })
    })
  ]);

  this.render(hbs`
    {{ko-app-slot
      name="case-sidebar"
    }}
  `);

  assert.equal(this.$('.app').length, 1, 'renders the app');
});
