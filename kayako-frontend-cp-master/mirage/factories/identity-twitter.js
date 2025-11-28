import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  twitter_id: faker.random.number,
  full_name: 'Robert J Cole',
  screen_name: faker.internet.userName,
  follower_count: 512,
  description: 'WAT',
  url: (i) => `http://twitter.com/twitterhandler${i}`,
  location: 'Denver, CO',
  profile_image_url: 'http://www.fillmurray.com/g/250/250',
  locale: 'en',
  resource_type: 'identity_twitter',
  is_validated: true
});
