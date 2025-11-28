import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  resource_type: 'product_rateplan',
  name: 'Growth - Monthly',
  type: 'PRIMARY',
  key: 'growth',
  label: 'Growth',
  facebook_accounts: null,
  twitter_accounts: null,
  attachment_size: null,
  description: 'Everything you need to get better at customer service',
  slas: 999,
  business_hours: 999,
  brands: 2,
  api_rate_limit: 400,
  attachment_size_limit: 20,
  product: null,
  charges: () => []
});
