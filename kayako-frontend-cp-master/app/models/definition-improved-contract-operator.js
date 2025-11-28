import DS from 'ember-data';

export default DS.Model.extend({
  label: DS.attr('string'),
  originalFieldName: DS.attr('string'),
  input: DS.belongsTo('definition-improved-contract-input')
});
