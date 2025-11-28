import DS from 'ember-data';

export default DS.Model.extend({
  score: DS.attr('string'),
  comment: DS.attr('string'),
  case: DS.belongsTo('case'),
  creator: DS.belongsTo('user'),
  createdAt: DS.attr('date')
});
