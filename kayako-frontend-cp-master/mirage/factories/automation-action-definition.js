import Mirage, { faker } from 'ember-cli-mirage';

const inputTypes = [
  'INTEGER', 'FLOAT', 'STRING', 'BOOLEAN', 'BOOLEAN_TRUE', 'BOOLEAN_FALSE',
  'OPTIONS', 'CASCADING_SELECT', 'MULTIPLE', 'TAGS', 'ENDPOINT_EMAIL', 'ENDPOINT_HTTP',
  'ENDPOINT_HTTP_JSON', 'ENDPOINT_HTTP_XML', 'ENDPOINT_SLACK', 'DATE_ABSOLUTE', 'EMAIL',
  'AUTOCOMPLETE', 'NOTIFICATION_USER', 'NOTIFICATION_TEAM'
];

const valueTypes = ['NUMERIC', 'FLOAT', 'STRING', 'BOOLEAN', 'COLLECTION', 'DATE_ABSOLUTE', 'TIME', 'ATTRIBUTES'];

export default Mirage.Factory.extend({
  label: i => `Automation Action label ${i}`,
  name: i => `Automation Action name ${i}`,
  options: i => [faker.list.cycle('CHANGE', 'REVERT', 'INCREASE', 'DECREASE', 'ADD', 'REMOVE', 'REPLACE', 'SEND')(i)],
  input_type: faker.list.cycle(...inputTypes),
  value_type: faker.list.cycle(...valueTypes),
  values: [],
  attributes: [],
  group: faker.list.cycle('CASE', 'CUSTOM_FIELD', 'NOTIFICATION', 'ENDPOINT', 'FLOW_CONTROL'),
  resource_type: 'automation_action_definition'
});
