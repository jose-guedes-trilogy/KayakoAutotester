import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  // CPs
  name: computed('extra.type', 'extra.identity.screenName', 'extra.identity.email',
  'extra.identity.number', 'extra.identity.userName', function () {
    switch (this.get('extra.type')) {
      case 'email':
        return this.get('extra.identity.email');
      case 'twitter':
        return `@${this.get('extra.identity.screenName')}`;
      case 'mobilePhone':
        return this.get('extra.identity.number');
      case 'facebook':
        return this.get('extra.identity.userName');
    }
  })
});
