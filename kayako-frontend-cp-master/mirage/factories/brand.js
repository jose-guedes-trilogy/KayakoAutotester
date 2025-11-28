import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  is_enabled: true,
  is_default: true,
  locale: null,
  alias: null,
  domain: 'kayako.com',
  sub_domain: 'support',
  name: 'Default',
  resource_type: 'brand',
  created_at: '2015-08-05T06:13:59Z',
  resource_url: 'http://novo/api/index.php?/v1/brands/1',
  updated_at: '2015-08-05T06:13:59Z',
  is_ssl_enabled: false,
  url: null
});
