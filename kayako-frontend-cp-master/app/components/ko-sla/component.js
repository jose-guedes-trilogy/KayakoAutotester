import { reads, or } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import moment from 'moment';

export default Component.extend({
  tagName: '',

  // Attributes
  metric: null,

  // Services
  serverClock: service(),
  developerTools: service(),

  // CPs
  serverTime: reads('serverClock.date'),

  isNotCompletedButPastDue: computed('metric.{dueAt,lastPausedAt,completedAt,stage}', 'serverTime', function() {
    if (this.get('metric.isPaused')) {
      return this.get('metric.completedAt') === null && moment(this.get('metric.lastPausedAt')).isAfter(this.get('metric.dueAt'));
    } else {
      return this.get('metric.completedAt') === null && this.get('serverTime').isAfter(this.get('metric.dueAt'));
    }
  }),

  isNotCompletedButPastDueByAMinuteOrMore: computed('metric.dueAt', 'metric.completedAt', 'serverTime', function() {
    return this.get('metric.completedAt') === null && this.get('serverTime').isAfter(moment(this.get('metric.dueAt')).add(59, 'seconds'));
  }),

  isCompletedButPastDue: computed('metric.{dueAt,lastPausedAt,completedAt,stage}', 'serverTime', function() {
    if (this.get('metric.isPaused')) {
      return this.get('metric.completedAt') !== null && moment(this.get('metric.lastPausedAt')).isAfter(this.get('metric.dueAt'));
    } else {
      return moment(this.get('metric.completedAt')).isAfter(this.get('metric.dueAt'));
    }
  }),

  isCompletedButPastDueByAMinuteOrMore: computed('metric.{completedAt,dueAt}', function() {
    return moment(this.get('metric.completedAt')).isAfter(moment(this.get('metric.dueAt')).add(59, 'seconds'));
  }),

  isBreached: or('isCompletedButPastDue', 'isNotCompletedButPastDue'),

  isBreachedByAMinuteOrMore: or('isCompletedButPastDueByAMinuteOrMore', 'isNotCompletedButPastDueByAMinuteOrMore'),

  iconClassName: computed('metric.stage', 'isBreached', function () {
    switch (this.get('metric.stage')) {
      case 'PAUSED':
        return 'i-paused';
      case 'ACTIVE':
        return 'i-clock';
      case 'COMPLETED':
        return this.get('isBreached') ? 'i-cross-bold' : 'i-tick';
    }
  }),

  status: computed('metric.stage', 'isBreached', function () {
    const stage = this.get('metric.stage');
    const isBreached = this.get('isBreached');
    if (stage === 'COMPLETED') {
      return isBreached ? 'bad' : 'good';
    } else if (isBreached) {
      return 'breached';
    } else {
      return 'open';
    }
  }),

  sign: computed('isBreachedByAMinuteOrMore', function () {
    return this.get('isBreachedByAMinuteOrMore') ? '-' : '';
  })
});
