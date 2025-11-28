import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  locale: faker.list.cycle('en-us', 'de', 'en-gb'),
  translation: 'locale specific text here',
  created_at: faker.date.recent,
  updated_at: faker.date.recent,
  resource_type: 'locale_field',
  resource_url: 'https://brewfictus.kayako.com/api/v1/cases/fields/1/locales/2'
});
