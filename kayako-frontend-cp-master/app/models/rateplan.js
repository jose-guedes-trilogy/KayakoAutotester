import DS from 'ember-data';

export default DS.Model.extend({
  subscription: DS.belongsTo('subscription'),
  productRateplan: DS.belongsTo('product-rateplan'),
  charges: DS.hasMany('charge')
});
