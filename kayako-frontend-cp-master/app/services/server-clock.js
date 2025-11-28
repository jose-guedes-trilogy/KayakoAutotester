import Service from '@ember/service';
import { inject as service } from '@ember/service';
import moment from 'moment';
import { task, timeout } from 'ember-concurrency';
import { computed } from '@ember/object';

const MAX_SKEW = 10 * 60 * 1000;

export default Service.extend({

  // State
  date: null,
  tickTaskInstance: null,

  // Sometimes the API sends multiple headers, which leads to odd results
  lastKnownServerTime: computed({
    get() { /* */ },
    set(_k, value) {
      if (!value) { return value; }

      // Two headers get joined with comma, so just use the first if that happens
      return value.split(',')[0].trim();
    }
  }),

  // Services
  dateService: service('date'),
  developerTools: service('developerTools'),

  // Lifecycle hooks
  init: function() {
    this._super();
    this.set('date', this.getServerTime());
    this.set('tickTaskInstance', this.get('tick').perform());
  },

  // CP's
  // Positive skew means local time is ahead of server time
  // Negative skew means local time is behind server time
  skew: computed('lastKnownServerTime', function() {
    let lastKnownServerTime = this.get('lastKnownServerTime');

    if (!lastKnownServerTime) { return 0; }

    let serverDateTime = moment(lastKnownServerTime);
    let clientDateTime = moment(this.get('dateService').getCurrentDate());
    let result = clientDateTime.diff(serverDateTime);

    if (Math.abs(result) > MAX_SKEW) { return 0; }

    return result;
  }),

  hours: computed('date', function() {
    this.get('date').hours();
  }),

  minutes: computed('date', function() {
    this.get('date').minutes();
  }),

  seconds: computed('date', function() {
    this.get('date').seconds();
  }),

  // Methods
  restartRunningTick() {
    this.get('tickTaskInstance').cancel();
    this.set('tickTaskInstance', this.get('tick').perform());
  },

  getServerTime() {
    const now = moment(this.get('dateService').getCurrentDate());
    return now.subtract(this.get('skew'), 'ms');
  },

  // Tasks
  tick: task(function * () {
    while (true) { // eslint-disable-line no-constant-condition
      this.set('date', this.getServerTime());
      if (Ember.testing) { return; }
      if (this.get('developerTools.slaMetricsInSeconds')) {
        yield timeout(1000); //Run every second
      } else {
        yield timeout(60000); //Run every minute
      }
    }
  }).restartable()
});
