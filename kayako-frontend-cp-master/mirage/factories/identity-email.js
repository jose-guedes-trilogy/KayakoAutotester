import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  is_primary: false,
  email: faker.internet.email,
  is_notification_enabled: faker.random.boolean,
  is_validated: faker.random.boolean,
  // created_at: '2015-07-23T13:36:12Z',
  // updated_at: '2015-07-23T13:36:12Z',
  resource_type: 'identity_email',
  resource_url: 'http://novo/api/index.php?/v1/identities/emails/1'
});
