import EmberObject from '@ember/object';
import Component from '@ember/component';
import _ from 'npm:lodash';

export default Component.extend({
  // Attributes
  sla: null,
  priorities: [],

  findTarget(priority, type) {
    return this.get('sla.targets').find(metric =>
      metric.get('priority') === priority && metric.get('slaTargetType') === type
    );
  },

  getOperationalHours(slaTargetType) {
    const target = this.get('sla.targets')
      .find(target => target.get('slaTargetType') === slaTargetType);
    return target ? target.get('operationalHours') : 'BUSINESS_HOURS';
  },

  actions: {
    setTargetGoalInSeconds(priority, slaTargetType, goalInSeconds) {
      const existingTarget = this.findTarget(priority, slaTargetType);
      if (_.isNumber(goalInSeconds) && !_.isNaN(goalInSeconds)) {
        if (!existingTarget) {
          this.get('sla.targets').pushObject(EmberObject.create({
            priority,
            slaTargetType,
            goalInSeconds,
            operationalHours: this.getOperationalHours(slaTargetType)
          }));
        } else {
          existingTarget.set('goalInSeconds', goalInSeconds);
        }
      } else if (existingTarget) {
        this.get('sla.targets').removeObject(existingTarget);
      }
    }
  }
});
