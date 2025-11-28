import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { assign } from '@ember/polyfills';
import moment from 'moment';

export function relativeTermForDate([then], { now, timezone }) {
  if (!then) { return null; }

  now = now || new Date();

  if (isToday(then, now, timezone)) {
    return 'today';
  }

  if (isYesterday(then, now, timezone)) {
    return 'yesterday';
  }

  return null;
}

function isToday(then, now, timezone) {
  then = moment.tz(then, timezone);
  now = moment.tz(now, timezone);

  let min = moment(now).startOf('day');
  let max = moment(min).endOf('day');

  return then.isBetween(min, max, null, '[]');
}

function isYesterday(then, now, timezone) {
  return isToday(then, moment(now).subtract(1, 'day'), timezone);
}

export default Helper.extend({
  moment: service(),

  timezone: readOnly('moment.timeZone'),

  timezoneDidChange: observer('timezone', function() {
    this.recompute();
  }),

  compute(args, options = {}) {
    let timezone = this.get('timezone');

    return relativeTermForDate(args, assign({}, options, { timezone }));
  }
});
