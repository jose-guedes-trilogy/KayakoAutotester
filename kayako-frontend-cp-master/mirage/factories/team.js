import { Factory, faker } from 'ember-cli-mirage';

export default Factory.extend({
  title: faker.list.cycle('Sales', 'Support', 'Finance', 'Human Resources'),
  businesshour: null,
  member_count: 0,
  created_at: () => new Date(),
  updated_at: () => new Date(),
  resource_type: 'team',
  resource_url: i => `/api/v1/teams/${i}`
});
