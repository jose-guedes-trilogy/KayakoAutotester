import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  // Attributes
  sla: null,
  metric: null,

  // Services
  i18n: service(),

  // CPs
  selected: computed('sla.targets.@each.operationalHours', function () {
    const target = this.get('sla.targets')
      .find(metric => metric.get('slaTargetType') === this.get('metric'));
    const hoursId = target ? target.get('operationalHours') : 'BUSINESS_HOURS';
    return this.get('options').find(option => option.id === hoursId);
  }),

  options: computed(function () {
    const t = hours => this.get('i18n').t(`admin.sla.edit.operational_hours.${hours}`);
    return [
      { label: t('business_hours'), id: 'BUSINESS_HOURS' },
      { label: t('calendar_hours'), id: 'CALENDAR_HOURS' }
    ];
  }),

  actions: {
    onChange(hours) {
      this.get('sla.targets')
        .filter(metric => metric.get('slaTargetType') === this.get('metric'))
        .forEach(metric => metric.set('operationalHours', hours.id));
    }
  }
});
