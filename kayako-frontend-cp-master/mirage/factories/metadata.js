import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  custom: null,
  system: null,
  resource_type: 'metadata'
});
