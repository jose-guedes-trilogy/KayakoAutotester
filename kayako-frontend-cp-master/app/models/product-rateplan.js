import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  productRateplanType: DS.attr('string'),
  key: DS.attr('string'),
  description: DS.attr('string'),
  minimum_amount_notification: DS.attr('string'),
  minimum_purchase_amount: DS.attr('string'),
  label: DS.attr('string'),
  charges: DS.hasMany('product-rateplan-charge'),
  product: DS.belongsTo()
});
