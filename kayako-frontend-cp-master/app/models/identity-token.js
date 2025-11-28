import DS from 'ember-data';

export default DS.Model.extend({
  token: DS.attr('string'),
  lastUsedAt: DS.attr('date'),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')
});
