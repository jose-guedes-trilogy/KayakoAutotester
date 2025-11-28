import DS from 'ember-data';

export default DS.Model.extend({
  action: DS.attr('string'),
  field: DS.attr('string'),
  oldValue: DS.attr('string'),
  newValue: DS.attr('string'),
  oldObject: DS.attr(),
  newObject: DS.attr()
});
