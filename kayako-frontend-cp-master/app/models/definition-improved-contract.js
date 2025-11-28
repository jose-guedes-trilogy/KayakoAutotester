import DS from 'ember-data';

export default DS.Model.extend({
  label: DS.attr('string'),
  operators: DS.hasMany('definition-improved-contract-operator'),
});
