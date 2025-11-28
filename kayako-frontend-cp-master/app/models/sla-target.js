import DS from 'ember-data';

export default DS.Model.extend({
  priority: DS.belongsTo('case-priority', { async: false }),
  slaTargetType: DS.attr('string'),
  goalInSeconds: DS.attr('number', { defaultValue: 86400 }),
  operationalHours: DS.attr('string', { defaultValue: 'BUSINESS_HOURS' })
});
