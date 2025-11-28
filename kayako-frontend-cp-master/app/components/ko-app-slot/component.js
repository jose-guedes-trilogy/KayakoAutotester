import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  apps: service(),

  name: null,

  appsForSlot: computed('name', function() {
    return this.get('apps').appsForSlot(this.get('name'));
  })
});
