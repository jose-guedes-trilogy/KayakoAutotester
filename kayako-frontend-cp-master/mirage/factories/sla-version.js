import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  title: 'Regular support and sales tickets',
  description: faker.lorem.sentence,
  created_at: faker.date.recent,
  resource_type: 'sla_version'
});
