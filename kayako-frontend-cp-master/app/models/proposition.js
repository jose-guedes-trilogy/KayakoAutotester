import DS from 'ember-data';

export default DS.Model.extend({
  field: DS.attr('string'),
  operator: DS.attr('string'),
  value: DS.attr()
});
