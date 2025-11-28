import DS from 'ember-data';

export default DS.Model.extend({
  label: DS.attr('string', { defaultValue: '' }),
  statusType: DS.attr('string', { defaultValue: 'CUSTOM' }),
  sortOrder: DS.attr('number'),
  isSlaActive: DS.attr('boolean', { defaultValue: false }),
  isDeleted: DS.attr('boolean', { defaultValue: false }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')
});
