import DS from 'ember-data';

export default DS.Model.extend({
  createdAt: DS.attr('date'),
  resultData: DS.belongsTo('any', { polymorphic: true }),
  relevance: DS.attr('number'),
  resource: DS.attr('string'),
  snippet: DS.attr('string'),
  title: DS.attr('string')
});
