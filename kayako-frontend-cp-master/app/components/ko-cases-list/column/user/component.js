import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  user: computed('model', function() {
    const model = this.get('model');
    if (!model) {
      return null;
    }
    return model.get(this.get('propertyName'));
  })
});
