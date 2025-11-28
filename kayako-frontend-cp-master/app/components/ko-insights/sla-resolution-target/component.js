import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import formatSeconds from 'frontend-cp/lib/humanize-seconds';

export default Component.extend({
  i18n: service(),
  tagName: '',
  data: null,
  performance: null,
  interval: null,
  section: null,

  onIntervalChange: null,

  targets: computed('data.targets', function() {
    const targets = this.get('data.targets');

    return targets.map(target => {
      target.metrics = target.metrics.map(metric => {
        if (metric.name === 'percentage_achieved') {
          return {
            name: metric.name,
            value: metric.value ? Math.round(metric.value) + '%' : 0,
            previous: metric.previous ? Math.round(metric.previous) + '%' : 0,
            delta: Math.round(metric.delta_percent),
            deltaInverted: false
          };
        } else if (['average_time_to_target', 'average_time_overdue_to_breach'].indexOf(metric.name) > -1) {
          return {
            name: metric.name,
            value: metric.value ? formatSeconds(metric.value) : 0,
            previous: metric.previous ? formatSeconds(metric.previous) : 0,
            delta: Math.round(metric.delta_percent),
            deltaInverted: true
          };
        } else if (metric.name === 'total_breached') {
          return {
            name: metric.name,
            value: metric.value ? this.get('i18n').formatNumber(metric.value) : 0,
            previous: metric.previous,
            delta: Math.round(metric.delta_percent),
            deltaInverted: true
          };
        }
      });

      return target;
    });
  }),

  performanceData: computed('performance', 'performance.performance_series', function() {
    const performance = this.get('performance');
    const performanceSeries = this.get('performance.performance_series.firstObject') || {};

    if (!performance) {
      return [];
    }

    performanceSeries.start_at = performance.start_at;
    performanceSeries.end_at = performance.end_at;
    performanceSeries.previous_start_at = performance.previous_start_at;
    performanceSeries.previous_end_at = performance.previous_end_at;
    performanceSeries.interval = performance.interval;
    performanceSeries.interval_count = performance.interval_count;

    return performanceSeries;
  })
});
