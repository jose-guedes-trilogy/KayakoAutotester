import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'charge',
  name: 'Growth - Monthly',
  type: 'RECURRING',
  model: 'PERUNITPRICING',
  list_price_base: null,
  unit_of_measure: 'AGENTS',
  quantity: 1,
  bill_cycle_type: 'CHARGETRIGGERDAY',
  billing_period: 'MONTH',
  total_contracted_value: null,
  discount_amount: null,
  monthly_recurring_charge: 59,
  monthly_recurring_revenue: 59,
  is_last_segment: true,
  charge_at: '1970-01-01T00:32:50+00:00',
  tiers: []
});
