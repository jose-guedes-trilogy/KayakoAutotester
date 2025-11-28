import DS from 'ember-data';

export default DS.Model.extend({
  status: DS.attr('string'),
  rateplans: DS.hasMany('rateplan'),
  account: DS.belongsTo('account')
});
