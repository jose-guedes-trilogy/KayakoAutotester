import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  endpoints: service(),

  onTypeSelect: () => {},

  actions: {
    selectType(type) {
      this.attrs.onTypeSelect(type);
    }
  }
});
