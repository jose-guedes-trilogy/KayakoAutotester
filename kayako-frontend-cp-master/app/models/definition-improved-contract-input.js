import DS from 'ember-data';

export default DS.Model.extend({
  inputType: DS.attr('string'),
  values: DS.attr('string')
});
