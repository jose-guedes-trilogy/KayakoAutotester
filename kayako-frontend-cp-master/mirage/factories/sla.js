import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  title: 'Regular support and sales tickets',
  description: faker.lorem.sentence,
  executionOrder: i => i,
  predicateCollections: () => [],
  filters: () => [],
  metrics: () => [],
  isEnabled: true,
  isDeleted: false,
  createdAt: faker.date.recent,
  updatedAt: faker.date.recent,
  resource_type: 'sla'
});
