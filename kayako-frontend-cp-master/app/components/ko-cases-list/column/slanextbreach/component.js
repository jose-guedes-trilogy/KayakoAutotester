import { or } from '@ember/object/computed';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: '',

  // Attributes
  model: null,

  // Services
  serverClock: service(),

  // CPs
  metric: or('oldestIncompleteMetric', 'nextMetricDue'),

  oldestIncompleteMetric: computed('model.slaMetrics.@each.{isCompleted,dueAt}', function() {
    return this.get('model.slaMetrics')
      .rejectBy('isCompleted')
      .sortBy('dueAt')
      .get('firstObject');
  }),

  nextMetricDue: computed('serverClock.date', 'model.slaMetrics.@each.dueAt', function() {
    let now = this.get('serverClock.date');

    return this.get('model.slaMetrics')
      .sortBy('dueAt')
      .find(metric => metric.get('dueAt') >= now);
  })
});
