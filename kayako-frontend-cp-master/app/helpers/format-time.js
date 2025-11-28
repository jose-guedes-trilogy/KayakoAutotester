import formatTime from 'ember-intl/helpers/format-time';
import { inject as service } from '@ember/service';

export default formatTime.extend({
  i18n: service(),

  compute(params, hash) {
    let timeFormatSettings = Object.assign({}, hash);

    timeFormatSettings.hour12 = this.get('i18n.hour12');
    if (params[0]) {
      return this._super(params, timeFormatSettings);
    } else {
      return null;
    }
  }
});
