import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';

export default Helper.extend({
  i18n: service(),

  compute([key], ...args) {
    return this.get('i18n').formatHtmlMessage(key, ...args);
  }
});
