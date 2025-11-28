import DS from 'ember-data';

export default DS.Model.extend({
  label: DS.attr('string'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),
  caseTypeType: DS.attr('string', { defaultValue: 'CUSTOM' })
});
