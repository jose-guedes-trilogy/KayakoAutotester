import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'product_rateplan_charge_tier',
  currency: 'USD',
  starting_unit: 0,
  ending_unit: null,
  price: 59,
  price_format: 'PERUNIT',
  tier: 1
});
