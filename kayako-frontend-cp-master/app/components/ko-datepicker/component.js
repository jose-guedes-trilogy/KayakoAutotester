import { observer, computed } from '@ember/object';
import { on } from '@ember/object/evented';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import _ from 'npm:lodash';
import moment from 'moment';
import * as KeyCodes from 'frontend-cp/lib/keycodes';

export default Component.extend({
  tagName: '',

  // Attributes
  onDateChange: null,
  onClose: null,
  date: null,

  // State
  today: null,
  shownDate: null,

  // Services
  dateService: service('date'),

  // Lifecycle hooks
  init() {
    this._super(...arguments);
    this.set('today', moment(this.get('dateService').getCurrentDate()));
  },

  onDateParamChange: on('init', observer('momentDate', function () {
    this.set('shownDate', moment(this.get('momentDate').isValid() ? this.get('momentDate') : this.get('today')).toDate());
  })),

  momentDate: computed('date', function () {
    return this.get('date') ? moment(this.get('date')) : moment(this.get('dateService').getCurrentDate());
  }),

  month: computed('shownDate', function () {
    return moment(this.get('shownDate')).month();
  }),

  year: computed('shownDate', function () {
    return moment(this.get('shownDate')).year();
  }),

  weekdays: computed(function () {
    let weekdays = moment.weekdaysShort();
    let firstDayOfWeek = moment.localeData().firstDayOfWeek();
    _.times(firstDayOfWeek, () => weekdays.push(weekdays.shift()));
    return weekdays;
  }),

  days: computed('year', 'month', 'today', 'momentDate', function () {
    let date = moment({
      year: this.get('year'),
      month: this.get('month'),
      day: 1
    }).startOf('week');

    let end = moment({
      year: this.get('year'),
      month: this.get('month'),
      day: 1
    }).add(1, 'month').endOf('week');

    let dates = [];
    while (date.isBefore(end, 'day') || date.isSame(end, 'day')) {
      dates.push({
        date: date.date(),
        month: date.month(),
        year: date.year(),
        currentMonth: date.month() === this.get('month'),
        today: this.get('today').isSame(date, 'day'),
        selected: date.isSame(this.get('momentDate'), 'day')
      });
      date.add(1, 'day');
    }
    return dates;
  }),

  jumpDateBy(method, range) {
    if (this.get('momentDate').isValid()) {
      this.setDate(moment(this.get('momentDate'))[method](1, range));
    }
    return false;
  },

  setDate(date) {
    let value = dateToUTC(date);
    this.attrs.onDateChange(value);
  },

  actions: {
    handleKeyDown(e) {
      // TODO: fix this bit, as it seems not to work.

      switch (e.keyCode) {
        case KeyCodes.up: {
          return this.jumpDateBy('subtract', 'week');
        }
        case KeyCodes.down: {
          return this.jumpDateBy('add', 'week');
        }
        case KeyCodes.left: {
          return this.jumpDateBy('subtract', 'day');
        }
        case KeyCodes.right: {
          return this.jumpDateBy('add', 'day');
        }
      }
    },

    previousMonth() {
      this.set('shownDate', moment(this.get('shownDate')).subtract(1, 'month').toDate());
    },

    nextMonth() {
      this.set('shownDate', moment(this.get('shownDate')).add(1, 'month').toDate());
    },

    selectDate(date) {
      this.setDate(moment({
        year: date.year,
        month: date.month,
        day: date.date
      }));
    },

    today() {
      this.setDate(moment(this.get('today')));
    },

    clear() {
      this.setDate(null);
    }
  }
});

function dateToUTC(date) {
  let m = moment(date);

  if (!m.isValid()) {
    return null;
  }

  let year = m.get('year');
  let month = m.get('month');
  let day = m.get('date');
  let result = moment([year, month, day]);

  return result.toDate();
}
