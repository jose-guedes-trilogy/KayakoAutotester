import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  // Attributes
  model: null,

  // CPs
  metric: computed('model.slaMetrics.@each.metricType', function () {
    return this.get('model.slaMetrics').findBy('metricType', 'FIRST_REPLY_TIME');
  })
});
