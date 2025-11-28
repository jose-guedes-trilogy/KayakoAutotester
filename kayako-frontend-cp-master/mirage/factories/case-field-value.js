import Mirage, { faker } from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  field: {},
  value: faker.random.title,
  resource_type: 'case_field_value'
});
