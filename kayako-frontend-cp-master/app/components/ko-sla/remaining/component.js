import Component from '@ember/component';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import moment from 'moment';
import { inject as service } from '@ember/service';
import { run } from '@ember/runloop';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({
  tagName: '',

  metric: null,
  seconds: null,
  shimmer: false,

  // Services
  serverClock: service(),
  date: service(),

  // CP's
  startedAt: reads('metric.startedAt'),
  dueAt: reads('metric.dueAt'),
  isCompleted: reads('metric.isCompleted'),
  lastPausedAt: reads('metric.lastPausedAt'),
  isPaused: reads('metric.isPaused'),
  completedAt: reads('metric.completedAt'),
  serverTime: reads('serverClock.date'),

  // Lifecycle Hook
  didReceiveAttrs() {
    this._super(...arguments);
    this.notifyPropertyChange('isBreached');
  },

  triggerBreached(isBreached) {
    if (this._isBreached !== isBreached && this.get('onBreachChange')) {
      run.next(() => {
        this.get('onBreachChange')(isBreached);
      });
    }

    this._isBreached = isBreached;
  },

  remainingSeconds: computed('startedAt', 'dueAt', 'isCompleted', 'lastPausedAt', 'isPaused', 'completedAt', 'isBreached', 'serverTime', function() {
    let to = 0;
    let from = 0;

    if (this.get('isCompleted') && this.get('startedAt') && !this.get('isBreached')) {
      to = this.get('startedAt').valueOf();
    } else if (this.get('dueAt')) {
      to = this.get('dueAt').valueOf();
    }

    if (this.get('isCompleted') && this.get('completedAt')) {
      from = this.get('completedAt').valueOf();
    } else if (this.get('isPaused') && this.get('lastPausedAt')) {
      from = this.get('lastPausedAt').valueOf();
    } else if (this.get('serverTime')) {
      from = this.get('serverTime').valueOf();
    }

    this.get('_secondsCounter').cancelAll();
    this.get('_showShimmer').perform();

    return Math.floor(Math.abs((to - from)) / 1000);
  }),

  numberOfWholeDaysRemaining: computed('remainingSeconds', function() {
    return Math.floor(Math.abs(moment.duration(this.get('remainingSeconds'), 'seconds').asDays()));
  }),

  numberOfWholeHoursRemaining: computed('remainingSeconds', function() {
    return Math.abs(moment.duration(this.get('remainingSeconds'), 'seconds').hours());
  }),

  numberOfWholeMinutesRemaining: computed('remainingSeconds', function() {
    return Math.abs(moment.duration(this.get('remainingSeconds'), 'seconds').minutes());
  }),

  timeRemaining: computed('remainingSeconds', 'seconds', function() {
    let days = Math.floor(Math.abs(moment.duration(this.get('remainingSeconds'), 'seconds').asDays()));
    let hours = Math.abs(moment.duration(this.get('remainingSeconds'), 'seconds').hours());
    let minutes = Math.abs(moment.duration(this.get('remainingSeconds'), 'seconds').minutes());
    const seconds = this.get('seconds');

    if (days && hours) {
      (minutes > 45) ? hours++ : hours--;
      minutes = null;
    }

    let formattedTime = '';

    if (days) {
      formattedTime = `${days}d`;
    }
    if (hours) {
      formattedTime += ` ${hours}h`;
    }
    if (minutes) {
      formattedTime += ` ${minutes}m`;
    }
    if (!days && !hours && !minutes) {
      this.get('_secondsCounter').perform();
      formattedTime += ` ${seconds}s`;
    }

    return formattedTime;
  }),

  timePassed: computed('remainingSeconds', function() {
    if (this.get('isCompleted') || this.get('isBreached') || !this.get('startedAt')) {
      return null;
    }

    const totalSeconds =  moment(this.get('dueAt')).diff(moment(this.get('startedAt')))/1000;
    const remainingFraction = this.get('remainingSeconds')/totalSeconds;
    const percentage = 100 - (remainingFraction * 100);

    return (percentage <= 100 && percentage > 0) ? `width: ${percentage}%` : null;
  }),

  isNotCompletedButPastDue: computed('metric.{dueAt,lastPausedAt,completedAt,stage}', 'serverTime', function() {
    if (this.get('isPaused')) {
      return this.get('completedAt') === null && moment(this.get('lastPausedAt')).isAfter(this.get('dueAt'));
    } else {
      return this.get('completedAt') === null && this.get('serverTime').isAfter(this.get('dueAt'));
    }
  }),

  isCompletedButPastDue: computed('metric.{dueAt,lastPausedAt,completedAt,isPaused}', 'serverTime', function() {
    if (!this.get('completedAt')) {
      return false;
    }

    if (this.get('isPaused')) {
      return moment(this.get('lastPausedAt')).isAfter(this.get('dueAt'));
    } else {
      return moment(this.get('completedAt')).isAfter(this.get('dueAt'));
    }
  }),

  isBreached: computed('isCompletedButPastDue', 'isNotCompletedButPastDue', function() {
    const isBreached = this.get('isCompletedButPastDue') || this.get('isNotCompletedButPastDue');

    this.triggerBreached(isBreached);

    return isBreached;
  }),

  isBreachedByAMinuteOrMore: computed('isBreached', 'metric', function() {
    return this.get('isBreached') && this.get('remainingSeconds') < 60;
  }),

  _secondsCounter: task(function * () {
    const seconds =  Math.abs(moment.duration(this.get('remainingSeconds'), 'seconds').seconds());
    this.set('seconds', seconds);

    // Show static value of seconds if case is paused/completed
    if (this.get('isPaused') || this.get('isCompleted')) {
      return;
    }

    if (Ember.testing) { return; }

    if (this.get('isBreached')) {
      while (this.get('seconds') < 60) {
        yield timeout(1000);
        this.incrementProperty('seconds');
        if (this.get('seconds') >= 59) {
          this.set('seconds', null);
          this.get('serverClock').restartRunningTick();
        }
      }
    } else {
      while (this.get('seconds') >= 0) {
        yield timeout(1000);
        this.decrementProperty('seconds');
        if (this.get('seconds') < 1) {
          this.set('seconds', null);
          this.get('serverClock').restartRunningTick();
        }
      }
    }
  }).drop(),

  _showShimmer: task(function * () {
    this.set('shimmer', true);
    yield timeout(800);
    this.set('shimmer', false);
  })
});
