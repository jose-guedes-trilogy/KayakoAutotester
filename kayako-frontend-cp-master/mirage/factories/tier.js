import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'tier',
  starting_unit: null,
  ending_unit: null,
  price: 59,
  price_format: 'PERUNIT',
  tier: 1
});
