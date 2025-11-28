import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  fielduuid: i => `fake-xxx-${i}`,
  type: faker.list.cycle('SUBJECT', 'MESSAGE', 'PRIORITY', 'STATUS', 'TYPE', 'TEAM', 'ASSIGNEE', 'TEXT', 'TEXTAREA', 'CHECKBOX', 'RADIO', 'SELECT', 'DATE', 'NUMERIC'),
  key: faker.list.cycle('subject', 'message', 'priority', 'status', 'type', 'team', 'assignee', 'text', 'textarea', 'checkbox', 'radio', 'select', 'date', 'numeric'),
  title: faker.list.cycle('Subject', 'Message', 'Priority', 'Status', 'Type', 'Team', 'Assignee', 'Text', 'Textarea', 'Checkbox', 'Radio', 'Select', 'Date', 'Numeric'),
  is_required_for_agents: true,
  is_required_on_resolution: true,
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
  created_at: '2015-07-09T15:36:10Z',
  updated_at: '2015-07-09T15:36:10Z',
  resource_type: 'case_field',
  resource_url: 'http://novo/api/index.php?/v1/cases/fields/1'
});
