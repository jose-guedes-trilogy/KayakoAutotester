import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  title: 'Internet Related Issue',
  is_visible_to_customers: true,
  customer_title: 'Internet Related Issue',
  description: null,
  is_enabled: true,
  is_default: false,
  sort_order: 1,
  fields: () => [],
  brand: null,
  created_at: '2015-07-09T15:36:10Z',
  updated_at: '2015-07-09T15:36:10Z',
  resource_type: 'case_form',
  resource_url: 'http://novo/api/index.php?/v1/cases/forms/1'
});
