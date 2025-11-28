import DS from 'ember-data';

export default DS.Model.extend({
  dueAt: DS.attr('date'),
  amount: DS.attr('number'),
  resourceUrl: DS.attr('string')
});
