import Mirage, {faker} from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  alt: null,
  content_id: null,
  created_at: faker.date.recent,
  height: 494,
  id: i => i + 1,
  name: i => `screenshot_${i + 1}.png`,
  resource_type: 'attachment',
  resource_url: 'http://novo/api/v1/cases/20/messages/33/attachments/3',
  size: 10000 + faker.random.number(10000000),
  thumbnails: [
   {url: `http://fillmurray.com/${faker.random.arrayElement([100, 200, 300])}/${faker.random.arrayElement([100, 200, 300])}`}
  ],
  type: 'image/png',
  url: 'http://fillmurray.com/400/100',
  url_download: 'http://novo/api/v1/cases/20/messages/33/attachments/3/download',
  width: 1220
});
