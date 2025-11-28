import DS from 'ember-data';

export default DS.Model.extend({
  deviceType: DS.attr('string'),
  value: DS.attr('string')
});
