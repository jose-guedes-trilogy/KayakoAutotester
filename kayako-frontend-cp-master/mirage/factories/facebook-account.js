import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  account_id: faker.random.number,
  resource_type: 'facebook_account',
  resource_url: 'http://novo/api/index.php?/v1/facebook/account/1',
  title: 'John Mathew',
  created_at: '2015-08-05T06:13:59Z',
  updated_at: '2015-08-05T06:13:59Z'
});
