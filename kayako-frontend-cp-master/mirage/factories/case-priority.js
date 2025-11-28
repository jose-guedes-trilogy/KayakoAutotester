import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  label: faker.list.cycle('Low', 'Normal', 'High', 'Urgent'),
  level: faker.list.cycle(1, 2, 3, 4),
  color: faker.list.cycle('green', 'yellow', 'orange', 'red'),
  locales: [],
  created_at: '2015-07-09T15:36:10Z',
  updated_at: '2015-07-09T15:36:10Z',
  resource_type: 'case_priority',
  resource_url: 'http://novo/api/index.php?/v1/cases/priorities/1'
});
