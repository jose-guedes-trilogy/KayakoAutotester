import Mirage from 'ember-cli-mirage';

export default Mirage.Factory.extend({
  id: i => i,
  key: null,
  token: null,
  tenant_id: null,
  signature: null,
  resource_type: 'token'
});
