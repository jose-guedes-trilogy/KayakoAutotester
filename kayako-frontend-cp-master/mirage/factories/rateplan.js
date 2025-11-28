import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'rateplan',
  name: null,
  product_rateplan: null,
  charges: () => []
});
