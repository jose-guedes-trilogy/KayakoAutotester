import DS from 'ember-data';

export default DS.Model.extend({
  price: DS.attr('string'),
  priceFormat: DS.attr('string'),
  currency: DS.attr('string'),
  endingUnit: DS.attr('number'),
  tier: DS.attr('number')
});
