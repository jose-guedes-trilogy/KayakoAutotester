import { inject as service } from '@ember/service';
import Helper from '@ember/component/helper';
import moment from 'moment';

export default Helper.extend({
  i18n: service(),

  compute([dateTime]) {
    let date = moment(dateTime);

    if (date.isBefore(moment().subtract('1', 'days'))) {
      return this.get('i18n').formatDate(dateTime, { format: 'lll' });
    } else {
      return date.fromNow();
    }
  }
});
