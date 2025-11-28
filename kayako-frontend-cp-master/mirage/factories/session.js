import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  id: 'pPW6tnOyJG6TmWCVea175d1bfc5dbf073a89ffeb6a2a198c61aae941Aqc7ahmzw8a',
  portal: 'API',
  ip_address: faker.internet.ip,
  user_agent: faker.internet.userAgent,
  user: {},
  status: 'ONLINE',
  created_at: '2015-07-23T16:32:01Z',
  last_activity_at: '2015-07-23T16:32:22Z',
  resource_type: 'session'
});
