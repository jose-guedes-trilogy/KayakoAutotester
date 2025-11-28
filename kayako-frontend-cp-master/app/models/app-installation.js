import DS from 'ember-data';

export default DS.Model.extend({
  app: DS.belongsTo('app'),
  iprompts: DS.attr()
});
