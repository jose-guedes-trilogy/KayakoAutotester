import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'billing',
  auto_pay: false,
  default_payment_method: null,
  bill_cycle_day: 1,
  payment_term: 'NET15',
  currency: 'USD',
  purchase_order_number: null,
  communication_profile_name: 'Default Profile'
});
