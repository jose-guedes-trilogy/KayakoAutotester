import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';

export default Helper.extend({
  permissions: service(),

  compute([name]) {
    return this.get('permissions').has(name);
  }
});
