import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  field: null,
  value: '',
  resource_type: 'user_field_value'
});
