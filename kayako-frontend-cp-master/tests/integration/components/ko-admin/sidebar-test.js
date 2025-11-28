import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';

moduleForComponent('ko-admin/sidebar', 'Integration | Component | ko-admin/sidebar', {
  integration: true,

  beforeEach() {
    // Mock services we’ll need for these tests.
    const PermissionsService = Service.extend({
      has() { return true; }
    });
    this.register('service:launchDarkly', Service.extend({}));
    this.register('service:permissions', PermissionsService);
  }
});

test('it hides account section for support.kayako.com', function(assert) {
  this.render(hbs`
    {{ko-admin/sidebar
      hostname="support.kayako.com"}}
  `);

  assert.ok(
    !this.$(':contains("admin.navigation.account")').length,
    'expected *not* to see the account section'
  );
});
