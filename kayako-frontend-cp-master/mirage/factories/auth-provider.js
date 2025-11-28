import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  provider_code: 'UAA',
  scheme: 'ACCOUNT',
  login_url: 'https://example.kayako.com/agent/',
  logout_url: 'https://example.kayako.com/agent/logout/',
  resource_type: 'provider'
});
