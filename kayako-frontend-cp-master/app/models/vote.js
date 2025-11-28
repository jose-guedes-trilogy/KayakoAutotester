import DS from 'ember-data';

export default DS.Model.extend({
  type: DS.attr('string'),
  user: DS.belongsTo('user', { async: false }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date')
});
