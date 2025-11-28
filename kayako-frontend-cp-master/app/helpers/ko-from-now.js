import { bind as runBind } from '@ember/runloop';
import Ember from 'ember';
import moment from 'moment';
import { observer } from '@ember/object';
import { get } from '@ember/object';
import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';

export default Helper.extend({
  serverClock: service(),
  date: service(),
  timeFormatter: service(),
  moment: service(),

  localeOrTimeZoneChanged: observer('moment.locale', 'moment.timeZone', function() {
    this.recompute();
  }),

  compute(params, { hideSuffix, locale, timeZone, customRelativeTime, short = false }) {
    if (!params[0]) {
      return '-';
    }
    let value = moment(params[0]);
    let timeFormatter = this.get('timeFormatter');
    let interval = timeFormatter.calculateAppropriateInterval(value);
    const serverClock = this.get('serverClock');

    this.clearTimer();
    if (interval && !Ember.testing) {
      this.intervalTimer = setTimeout(runBind(this, this.recompute), interval);
    }

    const morphedMoment = this.morphMoment(moment(value), { locale, timeZone });

    if (customRelativeTime) {
      return timeFormatter.getLocalizedOutput(serverClock.getServerTime(), morphedMoment, hideSuffix);
    } else if (short) {
      return timeFormatter.shortFormatRelative(serverClock.getServerTime(), morphedMoment);
    } else {
      return morphedMoment.from(serverClock.getServerTime(), hideSuffix) || '-';
    }
  },

  morphMoment(time, { locale, timeZone }) {
    const momentService = get(this, 'moment');

    locale = locale || get(momentService, 'locale');
    timeZone = timeZone || get(momentService, 'timeZone');

    if (locale && time.locale) {
      time = time.locale(locale);
    }

    if (timeZone && time.tz) {
      time = time.tz(timeZone);
    }

    return time;
  },

  clearTimer() {
    clearTimeout(this.intervalTimer);
  },

  destroy() {
    this.clearTimer();
    this._super(...arguments);
  }
});
