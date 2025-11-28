import DS from 'ember-data';

export default DS.Model.extend({
  deviceType: DS.attr('string'),
  fingerprintUuid: DS.attr('string'),
  deviceProperties: DS.belongsTo('deviceProperty')
});
