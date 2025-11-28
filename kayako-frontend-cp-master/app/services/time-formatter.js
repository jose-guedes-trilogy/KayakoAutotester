import Service from '@ember/service';
import { inject as service } from '@ember/service';
import moment from 'moment';
import momentToIntl from 'frontend-cp/utils/moment-to-intl';

const TEN_SECONDS = 10000;
const THIRTY_SECONDS = 30000;
const ONE_MINUTE = 60000;
const TWO_MINUTES = 120000;
const FIVE_MINUTES = 300000;
const NINETY_MINUTES = 5400000;
const THIRTY_SIX_HOURS = 129600000;
const ONE_YEAR = 31536000000;

export default Service.extend({
  date: service(),
  i18n: service(),

  // Methods
  getLocalizedOutput(now, momentTime, hideSuffix) {
    if (!momentTime.isValid()) {
      return '-';
    }
    const i18n = this.get('i18n');

    const diffFromNowInMS = momentTime.diff(now) * -1;
    const happenedToday = momentTime.isSame(now, 'day');
    const happenedThisYear = momentTime.isSame(now, 'year');

    if (happenedToday && diffFromNowInMS <= NINETY_MINUTES) {
      return momentTime.from(now, hideSuffix);
    } else if (happenedToday && diffFromNowInMS <= THIRTY_SIX_HOURS && momentTime.isSame(now, 'day')) {
      const dateForIntl = momentToIntl(momentTime);
      const time = i18n.formatTime(dateForIntl, {
        format: 'time'
      });
      return i18n.t('generic.at_time', { time });
    } else if (happenedThisYear && diffFromNowInMS <= ONE_YEAR) {
      const dateForIntl = momentToIntl(momentTime);
      const date = i18n.formatDate(dateForIntl, { format: 'dayMonth' });
      return i18n.t('generic.on_date', { date });
    } else {
      const dateForIntl = momentToIntl(momentTime);
      const date = i18n.formatDate(dateForIntl, { format: 'L' });
      return i18n.t('generic.on_date', { date });
    }
  },

  shortFormatRelative(now, momentTime) {
    const minute = 6e4;
    const hour = 36e5;
    const day = 864e5;
    const week = 6048e5;

    const i18n = this.get('i18n');

    const formats = {
      minutes: i18n.t('generic.minute_abbreviation'),
      hours: i18n.t('generic.hour_abbreviation'),
      days: i18n.t('generic.day_abbreviation')
    };

    const diff = Math.abs(momentTime.diff(now));
    let unit = null;
    let num = null;

    if (diff < minute) {
      unit = 'minutes';
      num = 1;
    } else if (diff < hour) {
      unit = 'seconds';
    } else if (diff < day) {
      unit = 'hours';
    } else if (diff < week) {
      unit = 'days';
    } else if (momentTime.isSame(now, 'year')) {
      return i18n.formatDate(momentTime, { format: 'dayMonth' });
    } else {
      return i18n.formatDate(momentTime, { format: 'll' });
    }

    if (!num) {
      if (unit === 'seconds') {
        num = Math.round(diff/minute);
        unit = 'minutes';
      }
      else {
        num = moment.duration(diff)[unit]();
      }
    }

    const unitStr = unit = formats[unit];

    return num + unitStr;
  },

  calculateAppropriateInterval(momentTime) {
    const diffInMS = moment(this.get('date').getCurrentDate()).diff(momentTime);
    if (diffInMS < TWO_MINUTES) {
      return TEN_SECONDS;
    } else if (diffInMS < FIVE_MINUTES) {
      return THIRTY_SECONDS;
    } else if (diffInMS < NINETY_MINUTES) {
      return ONE_MINUTE;
    } else if (diffInMS < THIRTY_SIX_HOURS) {
      return TWO_MINUTES;
    } else {
      return null;
    }
  }
});
