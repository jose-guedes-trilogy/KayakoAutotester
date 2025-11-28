import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'product_rateplan_charge',
  name: 'Growth - Monthly',
  type: 'RECURRING',
  model: 'PERUNITPRICING',
  unit_of_measure: 'AGENTS',
  default_quantity: 10,
  billing_period: 'MONTH',
  tiers: () => []
});
