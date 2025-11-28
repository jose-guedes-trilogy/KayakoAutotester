import DS from 'ember-data';

export default DS.Model.extend({
  billingPeriod: DS.attr('string'),
  model: DS.attr('string'),
  unitOfMeasure: DS.attr('string'),
  defaultQuantity: DS.attr('string'),
  tiers: DS.hasMany('product-rateplan-charge-tier')
});
