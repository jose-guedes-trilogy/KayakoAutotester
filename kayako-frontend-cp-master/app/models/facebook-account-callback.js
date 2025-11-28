import DS from 'ember-data';

export default DS.Model.extend({
  code: DS.attr('string'),
  state: DS.attr('string'),
  callback: DS.attr('string'),

  account: DS.belongsTo('facebook-account')
});
