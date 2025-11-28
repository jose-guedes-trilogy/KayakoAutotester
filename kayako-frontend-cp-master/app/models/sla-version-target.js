import DS from 'ember-data';

export default DS.Model.extend({
  priority: DS.belongsTo('case-priority'),
  slaVersionTargetType: DS.attr('string'),
  goalInSeconds: DS.attr('number'),
  operationalHours: DS.attr('string')
});
