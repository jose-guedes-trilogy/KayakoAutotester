import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  title: 'Administrator',
  type: 'ADMIN', // Can be either ADMIN, AGENT, COLLABORATOR or CUSTOMER.
  ip_restriction: null,
  password_expires_in_days: faker.random.number,
  is_two_factor_required: false,
  created_at: '2015-07-23T12:09:20Z',
  updated_at: '2015-07-23T12:09:20Z',
  resource_type: 'role',
  resource_url: 'http://novo/api/index.php?/v1/roles/1',
  is_system: true
});
