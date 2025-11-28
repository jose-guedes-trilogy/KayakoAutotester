import { computed } from '@ember/object';
import DS from 'ember-data';

export default DS.Model.extend({
  startedAt: DS.attr('date'),
  completedAt: DS.attr('date'),
  dueAt: DS.attr('date'),
  lastPausedAt: DS.attr('date'),
  metricType: DS.attr('string'),
  stage: DS.attr('string'),     //COMPLETED | PAUSED | ACTIVE
  target: DS.belongsTo('sla-version-target'),

  isCompleted: computed('stage', function() {
    return this.get('stage') === 'COMPLETED';
  }),

  isPaused: computed('stage', function() {
    return this.get('stage') === 'PAUSED';
  })
});
