import Helper from '@ember/component/helper';
import { get } from '@ember/object';
import { inject as service } from '@ember/service';
import { observer } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { assert } from '@ember/debug';
import { assign } from '@ember/polyfills';
import moment from 'moment';

export function groupByDay([items], { key, timezone } = {}) {
  assert('Must pass a key e.g. (group-by-day items key="createdAt")', key);

  let result = [];

  items.forEach(item => {
    let dateUTC = get(item, key);
    let day = dayForDate(dateUTC, timezone);
    let entry = result.findBy('day', day);

    if (!entry) {
      entry = { day, items: [] };
      result.push(entry);
    }

    entry.items.push(item);
  });

  return result;
}

function dayForDate(date, timezone) {
  date = moment(date);

  if (timezone) {
    date.tz(timezone);
  }

  return date.format('YYYY-MM-DD');
}

export default Helper.extend({
  moment: service(),

  timezone: readOnly('moment.timeZone'),

  timezoneDidChange: observer('timezone', function() {
    this.recompute();
  }),

  compute(args, options = {}) {
    let timezone = this.get('timezone');

    return groupByDay(args, assign({}, options, { timezone }));
  }
});
