import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  fielduuid: () => faker.random.uuid(),
  type: faker.list.cycle('TEXT', 'TEXTAREA', 'CHECKBOX'),
  key: i => `key ${i}`,
  title: 'title here',
  is_visible_to_customers: true,
  customer_titles: () => [],
  is_customer_editable: true,
  is_required_for_customers: true,
  descriptions: () => [],
  is_enabled: true,
  regular_expression: null,
  sort_order: 1,
  is_system: true,
  options: () => [],
  created_at: '2015-07-23T12:09:20Z',
  updated_at: '2015-07-23T12:09:20Z',
  resource_type: 'organization_field',
  resource_url: 'http://novo/api/index.php?/v1/organization/fields/1'
});
