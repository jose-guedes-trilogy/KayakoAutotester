import { Factory, faker } from 'ember-cli-mirage';

export default Factory.extend({
  name: 'Test OAuth Client',
  url: null,
  key: null,
  secret: null,
  scopes: [],
  logo: null,
  description: null,
  author: null,
  author_url: null,
  last_used_at: null,
  created_at: faker.date.recent,
  updated_at: faker.date.recent,
  resource_type: 'oauth_client'
});
