import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  field: null,
  operator: null,
  resource_type: 'proposition',
  value: null
});
