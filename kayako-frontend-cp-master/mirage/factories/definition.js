import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  label: null,
  field: null,
  type: null,
  sub_type: null,
  group: null,
  input_type: null,
  operators: () => [],
  values: null,
  resource_type: 'definition'
});
