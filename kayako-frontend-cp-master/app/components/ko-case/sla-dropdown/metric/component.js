import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  metric: null,
  isBreached: false,

  status: computed('isBreached', 'metric.isCompleted', 'metric.isPaused', function () {
    if (this.get('isBreached')) {
      return 'bad';
    }
    if (this.get('metric.isPaused')) {
      return 'paused';
    }
    if (this.get('metric.isCompleted')) {
      return 'good';
    }
    {
      return 'active';
    }
  }),

  icon: computed('metric.stage', 'isBreached', function () {
    switch (this.get('metric.stage')) {
      case 'PAUSED':
        return 'pause';
      case 'ACTIVE':
        return 'clock';
      case 'COMPLETED':
        return 'tick';
    }
  }),

  actions: {
    breachChange(e, value) {
      this.set('isBreached', value);
    }
  }
});
