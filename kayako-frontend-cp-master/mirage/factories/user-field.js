import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  fielduuid: () => faker.random.uuid(),
  title: 'title here',
  type: faker.list.cycle('TEXT', 'TEXTAREA', 'CHECKBOX'),
  key: i => `key ${i}`,
  is_visible_to_customers: true,
  customer_titles: () => [],
  is_customer_editable: true,
  is_required_for_customers: false,
  descriptions: () => [],
  regular_expression: null,
  sort_order: i => i + 1,
  is_enabled: true,
  options: () => [],
  created_at: '2015-07-23T12:09:20Z',
  updated_at: '2015-07-23T12:09:20Z',
  resource_type: 'user_field',
  resource_url: 'http://novo/api/index.php?/v1/users/fields/1'
});
