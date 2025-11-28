import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  facebook_id: faker.random.number,
  user_name: faker.internet.userName,
  full_name: faker.name.findName,
  is_validated: true,
  email: (i) => `email${i}@example.com`,
  bio: 'Lorem ipsum dolor sit amet',
  birth_date: '03/09/1986',
  website: 'http://foo.bar',
  profile_url: (i) => `http://facebook.com/user${i}`,
  locale: 'en',
  resource_type: 'identity_facebook'
});
