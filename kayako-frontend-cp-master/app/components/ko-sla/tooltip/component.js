import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/string';
import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  // Attributes
  metric: null,
  isBreached: false,

  // Services
  i18n: service(),

  // CPs
  tooltipTitle: computed('metric.metricType', 'metric.isCompleted', 'metric.dueAt',
  'metric.completedAt', 'metric.target.operationalHours', function () {
    const i18n = this.get('i18n');
    let madeDueSlug = '';
    if (this.get('metric.isCompleted')) {
      madeDueSlug = 'made';
    } else if (this.get('isBreached')) {
      madeDueSlug = 'was_due';
    } else {
      madeDueSlug = 'due';
    }
    const time = this.get('metric.isCompleted') ? this.get('metric.completedAt') : this.get('metric.dueAt');

    const metric = i18n.t(`cases.sla.tooltip.metric.${this.get('metric.metricType')}`);
    const made_due = i18n.t(`cases.sla.tooltip.${madeDueSlug}`);
    const due_time = i18n.formatDate(time, { format: 'fullWithTime' });
    const operational_hours = i18n.t(`cases.sla.tooltip.operational_hours.${this.get('metric.target.operationalHours')}`);

    return htmlSafe(i18n.t('cases.sla.tooltip.sentence', {
      metric,
      made_due,
      due_time,
      operational_hours
    }));
  })
});
