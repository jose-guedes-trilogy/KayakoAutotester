import DS from 'ember-data';

export default DS.Model.extend({
  identity: DS.belongsTo('identity-email'),

  user: DS.belongsTo('user', { async: true })
});
