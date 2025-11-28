import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  fielduuid: faker.list.cycle('fake-XXXX-1', 'fake-XXXX-2', 'fake-XXXX-3', 'fake-XXXX-4', 'fake-XXXX-5'),
  values: () => [],
  tag: faker.list.cycle('internet', 'connectivity', 'yes'),
  sort_order: faker.random.number,
  created_at: '2015-07-23T12:09:20Z',
  updated_at: '2015-07-23T12:09:20Z',
  resource_type: 'field_option'
});
