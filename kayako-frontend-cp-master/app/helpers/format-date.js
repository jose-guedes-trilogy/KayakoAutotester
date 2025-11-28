import formatDate from 'ember-intl/helpers/format-date';
import { inject as service } from '@ember/service';

export default formatDate.extend({
  i18n: service(),

  compute([date], hash) {
    // On migrated instances dates in custom fields may come through as
    // "unknown".  This normalizes such values to null.
    if (date === 'unknown') {
      date = null;
    }

    let timeFormatSettings = Object.assign({}, hash);

    timeFormatSettings.hour12 = this.get('i18n.hour12');

    if (date) {
      return this._super([date], timeFormatSettings);
    } else {
      return null;
    }
  }
});
