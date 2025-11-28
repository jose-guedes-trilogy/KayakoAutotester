import DS from 'ember-data';

export default DS.Model.extend({
  key: DS.attr('string'),
  label: DS.attr('string'),
  required: DS.attr('boolean'),
  inputType: DS.attr('string'),
  access: DS.attr('string'),
  value: DS.attr('string')
});
