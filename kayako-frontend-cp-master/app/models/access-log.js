import DS from 'ember-data';

export default DS.Model.extend({
  user: DS.belongsTo('user', { async: true }),
  action: DS.attr('string'),
  createdAt: DS.attr('date')
});
