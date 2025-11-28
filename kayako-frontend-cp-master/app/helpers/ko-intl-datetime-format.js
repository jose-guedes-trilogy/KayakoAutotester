import { inject as service } from '@ember/service';
import Helper from '@ember/component/helper';
import moment from 'moment';
import momentToIntl from 'frontend-cp/utils/moment-to-intl';
import { observer } from '@ember/object';

export default Helper.extend({
  moment: service(),
  date: service(),

  timezoneDidChange: observer('moment.timeZone', function() {
    this.recompute();
  }),

  compute([dateTime]) {
    if (!dateTime) {
      return null;
    }

    let date = moment(dateTime).tz(this.get('moment.timeZone'));

    // timeZone can be null if the browser settings are not usual.
    // in this case, just return the date
    if (!date) {
      return this.get('date').getNewDate(dateTime);
    }

    return momentToIntl(date);
  }
});
